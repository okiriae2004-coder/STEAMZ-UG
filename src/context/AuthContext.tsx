import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole, RoleAssignment, SUPER_ADMIN_EMAIL, PhoneAccount } from '../types';

// Canonical phone digits normalizer for Uganda/Africa (strips 0 or 256, returns standard 12-digit string e.g. "256771234567")
export const normalizePhoneDigits = (raw: string): string => {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256') && digits.length >= 12) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return `256${digits}`;
};

// User-friendly display format (e.g. "+256 771 234 567")
export const formatUgPhoneDisplay = (raw: string): string => {
  const digits = normalizePhoneDigits(raw);
  if (digits.length === 12 && digits.startsWith('256')) {
    return `+256 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return digits ? `+${digits}` : '';
};

// Helper to strictly resolve role based on permissions
const resolveUserRole = (email?: string | null): UserRole => {
  if (!email) return 'customer';
  const lower = email.trim().toLowerCase();
  if (lower === SUPER_ADMIN_EMAIL.toLowerCase()) return 'admin';
  try {
    const saved = localStorage.getItem('steamz_v4_role_assignments');
    if (saved) {
      const assignments: RoleAssignment[] = JSON.parse(saved);
      const found = assignments.find((a) => a.email.toLowerCase() === lower);
      if (found) return found.role;
    }
  } catch (e) {
    // ignore
  }
  return 'customer';
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  recipientPhoto?: string; // Picture of the person going to receive the delivery
  role: UserRole;
  universityId?: string;
  universityName?: string;
  residence?: string; // Hostel, Hall of residence or Off-campus area
  preferredDropSpotId?: string;
  whatsapp?: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithPhoneAndPin: (phone: string, pin: string) => Promise<void>;
  registerWithPhoneAndPin: (params: {
    phone: string;
    pin: string;
    displayName: string;
    universityId?: string;
    preferredDropSpotId?: string;
  }) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role?: UserRole,
    universityId?: string,
    preferredDropSpotId?: string,
    whatsapp?: string,
    residence?: string,
    recipientPhoto?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserSpotPreference: (spotId: string) => Promise<void>;
  updateUserWhatsApp: (whatsapp: string) => Promise<void>;
  updateUserUniversity: (uniId: string, preferredSpotId?: string) => Promise<void>;
  loginAsDemoUser: (role: UserRole) => void;
  isDemoUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Auto-migrate any local PIN accounts to Cloud Firestore on mount for complete cross-device persistence
  useEffect(() => {
    const migrateLocalAccountsToCloud = async () => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('steamz_phone_')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                const phoneInput = parsed.phoneDigits || parsed.phone || '';
                if (phoneInput && parsed.pin) {
                  const digits = normalizePhoneDigits(phoneInput);
                  if (digits.length >= 9) {
                    const docId = `phone_${digits}`;
                    const cloudSnap = await getDoc(doc(db, 'phoneAccounts', docId));
                    if (!cloudSnap.exists()) {
                      const accountDoc: PhoneAccount = {
                        docId,
                        phoneDigits: digits,
                        phone: parsed.phone || formatUgPhoneDisplay(digits),
                        pin: String(parsed.pin).trim(),
                        displayName: parsed.displayName || `Student (${digits.slice(-4)})`,
                        uid: parsed.uid || `user-phone-${digits}`,
                        email: parsed.email || `phone_${digits}@steamz.ug`,
                        role: 'customer',
                        universityId: parsed.universityId || 'kiu-western',
                        universityName:
                          parsed.universityName ||
                          'Kampala International University (KIU Western)',
                        preferredDropSpotId: parsed.preferredDropSpotId || 'spot-kiu-eng',
                        createdAt: parsed.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      await setDoc(doc(db, 'phoneAccounts', docId), accountDoc);
                      console.log(`[STEAMZ Cloud Sync] Migrated local account ${digits} to Cloud Firestore.`);
                    }
                  }
                }
              } catch (parseErr) {
                // ignore
              }
            }
          }
        }
      } catch (err) {
        console.warn('Local account cloud sync notice:', err);
      }
    };

    migrateLocalAccountsToCloud();
  }, []);

  // Restore local session on initial mount (for Vercel deployment fallback or offline mode)
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('steamz_local_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as UserProfile;
        if (parsed && parsed.email) {
          // Strictly enforce role integrity
          parsed.role = resolveUserRole(parsed.email);
          setUserProfile(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not restore local session:', e);
    }
  }, []);

  // Sync profile from Firestore when user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoUser(false);
        const userDocRef = doc(db, 'users', user.uid);
        const authorizedRole = resolveUserRole(user.email);
        try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            // Strict role assignment check:
            // okiriae2004@gmail.com is always super admin
            // others are checked against authorized role
            if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
              data.role = 'admin';
            } else if (data.role !== authorizedRole) {
              data.role = authorizedRole;
            }
            setUserProfile(data);
            try {
              localStorage.setItem('steamz_local_session', JSON.stringify(data));
            } catch (e) {}
          } else {
            // First time login - create default customer profile (or admin if super admin)
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'STEAMZ Member',
              photoURL: user.photoURL || undefined,
              role: authorizedRole,
              universityId: 'kiu-western',
              universityName: 'Kampala International University (KIU Western)',
              preferredDropSpotId: 'spot-kiu-eng',
              whatsapp: '',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            try {
              localStorage.setItem('steamz_local_session', JSON.stringify(newProfile));
            } catch (e) {}
          }
        } catch (error) {
          console.warn('Error fetching or creating user profile in Firestore:', error);
          // Fallback in-memory profile with strictly authorized role
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'STEAMZ Member',
            photoURL: user.photoURL || undefined,
            role: authorizedRole,
            universityId: 'kiu-western',
            universityName: 'Kampala International University (KIU Western)',
            preferredDropSpotId: 'spot-kiu-eng',
            whatsapp: '',
          };
          setUserProfile(fallbackProfile);
          try {
            localStorage.setItem('steamz_local_session', JSON.stringify(fallbackProfile));
          } catch (e) {}
        }
      } else {
        if (!isDemoUser) {
          // If no Firebase user and no saved local session, reset
          const savedSession = localStorage.getItem('steamz_local_session');
          if (!savedSession) {
            setUserProfile(null);
          }
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  // Google Social Sign In
  const signInWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const authorizedRole = resolveUserRole(user.email);
      const snapshot = await getDoc(userDocRef);
      if (!snapshot.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'STEAMZ Member',
          photoURL: user.photoURL || undefined,
          role: authorizedRole,
          universityId: 'kiu-western',
          universityName: 'Kampala International University (KIU Western)',
          preferredDropSpotId: 'spot-kiu-eng',
          whatsapp: '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        try {
          localStorage.setItem('steamz_local_session', JSON.stringify(newProfile));
        } catch (e) {}
      } else {
        const data = snapshot.data() as UserProfile;
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          data.role = 'admin';
        } else if (data.role !== authorizedRole) {
          data.role = authorizedRole;
        }
        setUserProfile(data);
        try {
          localStorage.setItem('steamz_local_session', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      const errorCode = error?.code || '';
      const errorMsg = error?.message || '';

      // If domain unauthorized and user is super admin email or in emergency mode
      if (
        errorCode === 'auth/unauthorized-domain' ||
        errorMsg.includes('unauthorized-domain')
      ) {
        // Still throw so AuthModal displays domain-authorization instructions
        throw error;
      }
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Backward compatible alias
  const normalizeUgPhone = (raw: string): string => normalizePhoneDigits(raw);

  const phoneToSyntheticEmail = (phoneOrDigits: string): string => {
    const digits = normalizePhoneDigits(phoneOrDigits);
    return `phone_${digits}@steamz.ug`;
  };

  // Sign In with WhatsApp / Phone Number OR Email + 4-6 digit PIN (100% Persistent across Cloud & Local)
  const loginWithPhoneAndPin = async (rawInput: string, rawPin: string) => {
    setAuthLoading(true);
    const cleanInput = rawInput.trim();
    const cleanPin = rawPin.trim();
    const isEmailInput = cleanInput.includes('@');

    const phoneDigits = isEmailInput ? '' : normalizePhoneDigits(cleanInput);
    const docId = isEmailInput
      ? `email_${cleanInput.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`
      : `phone_${phoneDigits}`;
    const displayPhone = isEmailInput ? cleanInput : (formatUgPhoneDisplay(cleanInput) || cleanInput);

    if (isEmailInput) {
      if (!cleanInput.includes('.') || cleanInput.length < 5) {
        setAuthLoading(false);
        throw new Error('Please enter a valid email address or WhatsApp phone number.');
      }
    } else {
      if (!phoneDigits || phoneDigits.length < 9) {
        setAuthLoading(false);
        throw new Error('Please enter a valid WhatsApp phone number or email.');
      }
    }

    if (!cleanPin || cleanPin.length < 4) {
      setAuthLoading(false);
      throw new Error('Please enter your 4 to 6 digit secret PIN.');
    }

    let foundAccount: any = null;

    // 1. Check Cloud Firestore FIRST for cross-device, cross-browser persistence
    try {
      const cloudSnap = await getDoc(doc(db, 'phoneAccounts', docId));
      if (cloudSnap.exists()) {
        foundAccount = cloudSnap.data();
        console.log(`[STEAMZ Auth] Found phone account in Cloud Firestore for ${docId}`);
      }
    } catch (cloudErr) {
      console.warn('Firestore phone lookup error or offline:', cloudErr);
    }

    // 1b. If entered email, also check by matching email in phoneAccounts documents
    if (!foundAccount && isEmailInput) {
      try {
        const emailLower = cleanInput.toLowerCase();
        // check direct doc email_...
        const emailSnap = await getDoc(doc(db, 'phoneAccounts', `email_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`));
        if (emailSnap.exists()) {
          foundAccount = emailSnap.data();
        }
      } catch (e) {}
    }

    // 2. Check local credentials cache if not found in Firestore (e.g. offline or instant local cache)
    if (!foundAccount) {
      try {
        const localKey = isEmailInput
          ? `steamz_email_${cleanInput.toLowerCase()}`
          : `steamz_phone_${phoneDigits}`;
        const localRaw =
          localStorage.getItem(localKey) ||
          (!isEmailInput
            ? localStorage.getItem(`steamz_phone_+${phoneDigits}`) ||
              localStorage.getItem(`steamz_phone_0${phoneDigits.slice(3)}`)
            : null);
        if (localRaw) {
          foundAccount = JSON.parse(localRaw);
          // If found in localStorage, immediately sync back to Cloud Firestore
          if (foundAccount) {
            setDoc(doc(db, 'phoneAccounts', docId), {
              ...foundAccount,
              docId,
              phoneDigits: phoneDigits || foundAccount.phoneDigits || '',
              updatedAt: new Date().toISOString(),
            }).catch(() => {});
          }
        }
      } catch (localErr) {
        console.warn('Local credentials cache lookup error:', localErr);
      }
    }

    // 3. Fallback scan of all localStorage keys
    if (!foundAccount) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('steamz_phone_') || key.startsWith('steamz_email_'))) {
            const rawVal = localStorage.getItem(key);
            if (rawVal) {
              const parsed = JSON.parse(rawVal);
              if (parsed) {
                if (isEmailInput && parsed.email?.toLowerCase() === cleanInput.toLowerCase()) {
                  foundAccount = parsed;
                  break;
                } else if (!isEmailInput && (parsed.phone || parsed.phoneDigits)) {
                  const itemDigits = normalizePhoneDigits(parsed.phoneDigits || parsed.phone);
                  if (itemDigits === phoneDigits) {
                    foundAccount = parsed;
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (scanErr) {
        // ignore
      }
    }

    // 4. Verify Account & PIN
    if (foundAccount) {
      const storedPin = String(foundAccount.pin || '').trim();
      if (storedPin !== cleanPin) {
        setAuthLoading(false);
        throw new Error('Incorrect PIN. Please re-enter your secret PIN.');
      }

      // PIN matches! Build and activate user profile
      const effectiveDigits = phoneDigits || foundAccount.phoneDigits || '0000000000';
      const uid = foundAccount.uid || `user-phone-${effectiveDigits}`;
      const syntheticEmail =
        foundAccount.email ||
        (isEmailInput ? cleanInput : `phone_${effectiveDigits}@steamz.ug`);
      const displayName =
        foundAccount.displayName ||
        (isEmailInput ? cleanInput.split('@')[0] : `Student (${effectiveDigits.slice(-4)})`);
      const universityId = foundAccount.universityId || 'kiu-western';
      const universityName =
        foundAccount.universityName ||
        (universityId === 'kiu-western'
          ? 'Kampala International University (KIU Western)'
          : universityId);
      const preferredDropSpotId = foundAccount.preferredDropSpotId || 'spot-kiu-eng';

      const profile: UserProfile = {
        uid,
        email: syntheticEmail,
        displayName,
        phone: foundAccount.phone || (isEmailInput ? '' : displayPhone),
        whatsapp: foundAccount.whatsapp || foundAccount.phone || (isEmailInput ? '' : displayPhone),
        role: resolveUserRole(syntheticEmail),
        universityId,
        universityName,
        preferredDropSpotId,
        createdAt: foundAccount.createdAt || new Date().toISOString(),
      };

      setUserProfile(profile);
      setIsDemoUser(false);

      // Cache session locally
      try {
        localStorage.setItem('steamz_local_session', JSON.stringify(profile));
        if (effectiveDigits) {
          localStorage.setItem(`steamz_phone_${effectiveDigits}`, JSON.stringify(foundAccount));
        }
        if (syntheticEmail) {
          localStorage.setItem(`steamz_email_${syntheticEmail.toLowerCase()}`, JSON.stringify(foundAccount));
        }
      } catch (e) {}

      // Update last login in Cloud Firestore
      try {
        await updateDoc(doc(db, 'phoneAccounts', docId), {
          lastLoginAt: new Date().toISOString(),
        });
      } catch (e) {}

      setAuthLoading(false);
      return;
    }

    // 5. Account not found anywhere
    setAuthLoading(false);
    throw new Error(
      `No account found matching "${displayPhone}". Please enter your registered WhatsApp number or contact your Admin to generate your 4-digit PIN.`
    );
  };

  // Register with WhatsApp / Phone Number + 4-6 digit PIN (Saved to Cloud Firestore & Local Cache)
  const registerWithPhoneAndPin = async ({
    phone: rawPhone,
    pin: rawPin,
    displayName,
    universityId = 'kiu-western',
    preferredDropSpotId = 'spot-kiu-eng',
  }: {
    phone: string;
    pin: string;
    displayName: string;
    universityId?: string;
    preferredDropSpotId?: string;
  }) => {
    setAuthLoading(true);
    const phoneDigits = normalizePhoneDigits(rawPhone);
    const cleanPin = rawPin.trim();
    const docId = `phone_${phoneDigits}`;
    const displayPhone = formatUgPhoneDisplay(rawPhone) || rawPhone;
    const syntheticEmail = `phone_${phoneDigits}@steamz.ug`;
    const syntheticPass = `PIN_${cleanPin}_Steamz`;
    const cleanName = displayName.trim() || `Student ${phoneDigits.slice(-4)}`;
    const uid = `user-phone-${phoneDigits}`;

    const universityName =
      universityId === 'kiu-western'
        ? 'Kampala International University (KIU Western)'
        : universityId;

    const newProfile: UserProfile = {
      uid,
      email: syntheticEmail,
      displayName: cleanName,
      phone: displayPhone,
      whatsapp: displayPhone,
      role: 'customer',
      universityId,
      universityName,
      preferredDropSpotId,
      createdAt: new Date().toISOString(),
    };

    const phoneAccountData: PhoneAccount = {
      docId,
      phone: displayPhone,
      phoneDigits,
      pin: cleanPin,
      displayName: cleanName,
      uid,
      email: syntheticEmail,
      role: 'customer',
      universityId,
      universityName,
      preferredDropSpotId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // 1. CLOUD PERSISTENCE: Save directly to Cloud Firestore phoneAccounts collection
    try {
      await setDoc(doc(db, 'phoneAccounts', docId), phoneAccountData);
      console.log(`[STEAMZ Auth] Successfully saved phone account to Cloud Firestore: ${docId}`);
    } catch (cloudErr) {
      console.warn('Could not write phoneAccount to Firestore:', cloudErr);
    }

    // 2. Also save to Firestore users/{uid} collection
    try {
      await setDoc(doc(db, 'users', uid), newProfile, { merge: true });
    } catch (userDocErr) {
      console.warn('Could not write user profile to Firestore:', userDocErr);
    }

    // 3. Optional Firebase Auth background creation
    try {
      const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, syntheticPass);
      await updateProfile(cred.user, { displayName: cleanName });
    } catch (fbErr: any) {
      console.warn('Firebase Auth background creation notice:', fbErr?.code || fbErr?.message);
    }

    // 4. LOCAL PERSISTENCE: Save into localStorage for instant offline access
    try {
      const accountJson = JSON.stringify(phoneAccountData);
      localStorage.setItem(`steamz_phone_${phoneDigits}`, accountJson);
      localStorage.setItem(`steamz_phone_+${phoneDigits}`, accountJson);
      localStorage.setItem(`steamz_phone_0${phoneDigits.slice(3)}`, accountJson);
      localStorage.setItem('steamz_local_session', JSON.stringify(newProfile));
    } catch (e) {
      console.warn('Local credential vault write error:', e);
    }

    setUserProfile(newProfile);
    setIsDemoUser(false);
    setAuthLoading(false);
  };

  // Email / Password Login with automatic fallback on unauthorized domain / disabled provider
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (error: any) {
      console.warn('Firebase Email Login encountered:', error?.code || error);
      const errorCode = error?.code || '';

      const isDomainOrConfigIssue =
        errorCode === 'auth/unauthorized-domain' ||
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/network-request-failed' ||
        errorCode === 'auth/invalid-credential';

      // Check registered phoneAccounts in Firestore (verify PIN / password)
      if (isDomainOrConfigIssue) {
        try {
          const q = query(collection(db, 'phoneAccounts'), where('email', '==', cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const acc = snap.docs[0].data() as PhoneAccount;
            const validSecret = String(acc.pin || (acc as any).password || '').trim();
            if (validSecret && (validSecret === cleanPass || validSecret === pass)) {
              const profile: UserProfile = {
                uid: acc.uid || snap.docs[0].id,
                email: acc.email || cleanEmail,
                displayName: acc.displayName || cleanEmail.split('@')[0],
                phone: acc.phone || '',
                whatsapp: acc.phone || '',
                role: resolveUserRole(acc.email || cleanEmail),
                universityId: acc.universityId || 'kiu-western',
                universityName:
                  acc.universityName || 'Kampala International University (KIU Western)',
                preferredDropSpotId: acc.preferredDropSpotId || 'spot-kiu-eng',
                createdAt: acc.createdAt || new Date().toISOString(),
              };

              setUserProfile(profile);
              setIsDemoUser(false);
              localStorage.setItem('steamz_local_session', JSON.stringify(profile));
              return;
            } else {
              const wrongPassErr = new Error('Incorrect password or PIN.');
              (wrongPassErr as any).code = 'auth/wrong-password';
              throw wrongPassErr;
            }
          }
        } catch (phoneErr: any) {
          if (phoneErr?.code === 'auth/wrong-password') throw phoneErr;
          console.warn('Phone accounts email check error:', phoneErr);
        }

        // Check locally registered accounts on Vercel
        try {
          const rawAccounts = localStorage.getItem('steamz_local_accounts');
          if (rawAccounts) {
            const accounts = JSON.parse(rawAccounts);
            const found = accounts.find((a: any) => a.email.toLowerCase() === cleanEmail);
            if (found) {
              if (found.password && found.password !== pass && found.password !== cleanPass) {
                const wrongPassErr = new Error('auth/wrong-password');
                (wrongPassErr as any).code = 'auth/wrong-password';
                throw wrongPassErr;
              }

              const localProfile: UserProfile = {
                uid: found.uid || `local-${Date.now()}`,
                email: found.email,
                displayName: found.displayName || found.email.split('@')[0],
                role: resolveUserRole(found.email),
                universityId: found.universityId || 'kiu-western',
                universityName:
                  found.universityName || 'Kampala International University (KIU Western)',
                preferredDropSpotId: found.preferredDropSpotId || 'spot-kiu-eng',
                whatsapp: found.whatsapp || '',
                createdAt: found.createdAt || new Date().toISOString(),
              };

              setUserProfile(localProfile);
              localStorage.setItem('steamz_local_session', JSON.stringify(localProfile));
              return;
            }
          }
        } catch (storageErr) {
          console.warn('Local account check error:', storageErr);
        }
      }

      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Email / Password Sign Up
  // Strictly enforce that all registrations receive their authorized role (default 'customer')
  const signupWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    _role?: UserRole,
    universityId: string = 'kiu-western',
    preferredDropSpotId: string = 'spot-kiu-eng',
    whatsapp: string = ''
  ) => {
    setAuthLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = resolveUserRole(cleanEmail);

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const user = cred.user;
      await updateProfile(user, { displayName });

      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        role: assignedRole,
        universityId,
        universityName:
          universityId === 'kiu-western'
            ? 'Kampala International University (KIU Western)'
            : universityId,
        preferredDropSpotId,
        whatsapp,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (err) {
        console.warn('Could not save user profile doc:', err);
      }

      setUserProfile(newProfile);
      try {
        localStorage.setItem('steamz_local_session', JSON.stringify(newProfile));
      } catch (e) {}
    } catch (error: any) {
      console.warn('Firebase Signup encountered:', error?.code || error);
      const errorCode = error?.code || '';

      // If Firebase email/password provider is not enabled in Firebase Console (auth/operation-not-allowed)
      // or domain is unauthorized on Vercel (auth/unauthorized-domain):
      // Save account locally so registration ALWAYS succeeds!
      if (
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/unauthorized-domain' ||
        errorCode === 'auth/network-request-failed'
      ) {
        const fallbackUid = `user-${Date.now()}`;
        const newProfile: UserProfile = {
          uid: fallbackUid,
          email: cleanEmail,
          displayName: displayName || cleanEmail.split('@')[0],
          role: assignedRole,
          universityId,
          universityName:
            universityId === 'kiu-western'
              ? 'Kampala International University (KIU Western)'
              : universityId,
          preferredDropSpotId,
          whatsapp,
          createdAt: new Date().toISOString(),
        };

        try {
          const rawAccounts = localStorage.getItem('steamz_local_accounts');
          const localAccounts = rawAccounts ? JSON.parse(rawAccounts) : [];
          if (localAccounts.some((a: any) => a.email.toLowerCase() === cleanEmail)) {
            const err = new Error('auth/email-already-in-use');
            (err as any).code = 'auth/email-already-in-use';
            throw err;
          }

          localAccounts.push({
            uid: fallbackUid,
            email: cleanEmail,
            password: pass,
            displayName,
            universityId,
            preferredDropSpotId,
            whatsapp,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('steamz_local_accounts', JSON.stringify(localAccounts));
          localStorage.setItem('steamz_local_session', JSON.stringify(newProfile));
        } catch (e) {
          console.warn('Could not save local account:', e);
        }

        setUserProfile(newProfile);
        return;
      }

      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setAuthLoading(true);
    try {
      if (!isDemoUser && auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Sign Out Error:', error);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setIsDemoUser(false);
      try {
        localStorage.removeItem('steamz_local_session');
      } catch (e) {}
      setAuthLoading(false);
    }
  };

  // Update user profile fields: Role cannot be updated unless caller is okiriae2004@gmail.com
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const safeUpdates: Partial<UserProfile> = { ...updates };
    if (safeUpdates.role !== undefined) {
      const activeEmail = currentUser?.email?.toLowerCase() || userProfile.email?.toLowerCase();
      if (activeEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        delete safeUpdates.role;
      }
    }
    const updated: UserProfile = { ...userProfile, ...safeUpdates };
    setUserProfile(updated);
    try {
      localStorage.setItem('steamz_local_session', JSON.stringify(updated));
    } catch (e) {}

    const uid = currentUser?.uid || userProfile.uid;
    if (uid && !isDemoUser) {
      try {
        await setDoc(doc(db, 'users', uid), safeUpdates, { merge: true });
      } catch (err) {
        console.warn('Could not sync user profile to Firestore:', err);
      }
    }

    // If phone account, also sync to phoneAccounts collection
    if (updated.phone) {
      try {
        const digits = normalizePhoneDigits(updated.phone);
        await updateDoc(doc(db, 'phoneAccounts', `phone_${digits}`), {
          ...safeUpdates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {}
    }
  };

  // Spot preference updater
  const updateUserSpotPreference = async (spotId: string) => {
    await updateUserProfile({ preferredDropSpotId: spotId });
  };

  // WhatsApp number updater
  const updateUserWhatsApp = async (whatsapp: string) => {
    await updateUserProfile({ whatsapp });
  };

  // University updater
  const updateUserUniversity = async (uniId: string, preferredSpotId?: string) => {
    if (!userProfile) return;
    const updates: Partial<UserProfile> = {
      universityId: uniId,
      universityName:
        uniId === 'kiu-western'
          ? 'Kampala International University (KIU Western)'
          : uniId,
      ...(preferredSpotId ? { preferredDropSpotId: preferredSpotId } : {}),
    };
    await updateUserProfile(updates);
  };

  // Demo user login: visitors can preview as KIU Student only. Admin and Owner cannot be accessed via demo
  const loginAsDemoUser = () => {
    setIsDemoUser(true);
    const demoProfile: UserProfile = {
      uid: `demo-customer-${Date.now()}`,
      email: 'alex.atukwase@kiu.ac.ug',
      displayName: 'Alex Atukwase (KIU Student)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      recipientPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
      role: 'customer',
      universityId: 'kiu-western',
      universityName: 'Kampala International University (KIU Western)',
      residence: 'Main Campus Block B / Hostel 4, Room 12',
      preferredDropSpotId: 'spot-kiu-eng',
      whatsapp: '+256 704 123456',
      createdAt: new Date().toISOString(),
    };
    setUserProfile(demoProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        authLoading,
        signInWithGoogle,
        loginWithPhoneAndPin,
        registerWithPhoneAndPin,
        loginWithEmail,
        signupWithEmail,
        logout,
        updateUserProfile,
        updateUserSpotPreference,
        updateUserWhatsApp,
        updateUserUniversity,
        loginAsDemoUser,
        isDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
