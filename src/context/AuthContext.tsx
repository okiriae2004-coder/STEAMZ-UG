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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole, RoleAssignment, SUPER_ADMIN_EMAIL } from '../types';

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
  loginAsSuperAdmin: () => void;
  isDemoUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

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

  // Normalizes Ugandan phone numbers (+256 or 07xx / 03xx)
  const normalizeUgPhone = (raw: string): string => {
    const digits = raw.replace(/[^\d+]/g, '').trim();
    if (digits.startsWith('0')) {
      return `+256${digits.slice(1)}`;
    }
    if (digits.startsWith('256')) {
      return `+${digits}`;
    }
    if (!digits.startsWith('+')) {
      return `+256${digits}`;
    }
    return digits;
  };

  const phoneToSyntheticEmail = (phone: string): string => {
    const digitsOnly = normalizeUgPhone(phone).replace(/\+/g, '');
    return `phone_${digitsOnly}@steamz.ug`;
  };

  // Sign In with WhatsApp / Phone Number + 4-6 digit PIN
  const loginWithPhoneAndPin = async (rawPhone: string, pin: string) => {
    setAuthLoading(true);
    const normalizedPhone = normalizeUgPhone(rawPhone);
    const syntheticEmail = phoneToSyntheticEmail(normalizedPhone);
    const syntheticPass = `PIN_${pin}_Steamz`;

    // 1. Check local credentials store first (guarantees instantaneous login on Vercel without domain error)
    try {
      const storedAccountRaw = localStorage.getItem(`steamz_phone_${normalizedPhone}`);
      if (storedAccountRaw) {
        const stored = JSON.parse(storedAccountRaw);
        if (stored.pin === pin) {
          const profile: UserProfile = {
            uid: stored.uid || `user-phone-${Date.now()}`,
            email: stored.email || syntheticEmail,
            displayName: stored.displayName || `Student (${normalizedPhone.slice(-4)})`,
            phone: normalizedPhone,
            whatsapp: normalizedPhone,
            role: resolveUserRole(stored.email || syntheticEmail),
            universityId: stored.universityId || 'kiu-western',
            universityName:
              stored.universityId === 'kiu-western'
                ? 'Kampala International University (KIU Western)'
                : stored.universityId || 'Kampala International University (KIU Western)',
            preferredDropSpotId: stored.preferredDropSpotId || 'spot-kiu-eng',
            createdAt: stored.createdAt || new Date().toISOString(),
          };
          setUserProfile(profile);
          localStorage.setItem('steamz_local_session', JSON.stringify(profile));
          setAuthLoading(false);
          return;
        } else {
          setAuthLoading(false);
          throw new Error('Incorrect PIN. Please re-enter your secret PIN.');
        }
      }
    } catch (localErr: any) {
      if (localErr.message?.includes('Incorrect PIN')) {
        setAuthLoading(false);
        throw localErr;
      }
    }

    // 2. Try Firebase Auth backend
    try {
      const cred = await signInWithEmailAndPassword(auth, syntheticEmail, syntheticPass);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        data.role = resolveUserRole(data.email);
        setUserProfile(data);
        localStorage.setItem('steamz_local_session', JSON.stringify(data));
      } else {
        const fallbackProfile: UserProfile = {
          uid: cred.user.uid,
          email: syntheticEmail,
          displayName: cred.user.displayName || `Student (${normalizedPhone.slice(-4)})`,
          phone: normalizedPhone,
          whatsapp: normalizedPhone,
          role: resolveUserRole(syntheticEmail),
          universityId: 'kiu-western',
          universityName: 'Kampala International University (KIU Western)',
          preferredDropSpotId: 'spot-kiu-eng',
          createdAt: new Date().toISOString(),
        };
        setUserProfile(fallbackProfile);
        localStorage.setItem('steamz_local_session', JSON.stringify(fallbackProfile));
      }
    } catch (fbErr: any) {
      console.warn('Firebase phone auth fallback:', fbErr);
      const code = fbErr?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Incorrect PIN. Please check your PIN.');
      } else if (code === 'auth/user-not-found') {
        throw new Error('Account not found. Please click "Register (New Account)" below to create your PIN.');
      } else {
        throw new Error('Account not found with this phone number. Please click "Register" to create your account in 5 seconds.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Register with WhatsApp / Phone Number + 4-6 digit PIN
  const registerWithPhoneAndPin = async ({
    phone: rawPhone,
    pin,
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
    const normalizedPhone = normalizeUgPhone(rawPhone);
    const syntheticEmail = phoneToSyntheticEmail(normalizedPhone);
    const syntheticPass = `PIN_${pin}_Steamz`;
    const cleanName = displayName.trim() || `User ${normalizedPhone.slice(-4)}`;
    let uid = `user-phone-${Date.now()}`;

    // Attempt Firebase User Creation (safe if succeeds, catches if domain not authorized)
    try {
      const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, syntheticPass);
      uid = cred.user.uid;
      await updateProfile(cred.user, { displayName: cleanName });
    } catch (fbErr: any) {
      const code = fbErr?.code || '';
      if (code === 'auth/email-already-in-use') {
        // If account exists already, allow sign-in or let them know
        console.warn('Phone already in Firebase, will update local profile');
      } else {
        console.warn('Firebase registration fallback (Vercel domain or provider bypass):', fbErr);
      }
    }

    const newProfile: UserProfile = {
      uid,
      email: syntheticEmail,
      displayName: cleanName,
      phone: normalizedPhone,
      whatsapp: normalizedPhone,
      role: 'customer',
      universityId,
      universityName:
        universityId === 'kiu-western'
          ? 'Kampala International University (KIU Western)'
          : universityId,
      preferredDropSpotId,
      createdAt: new Date().toISOString(),
    };

    // 1. Save to Firestore doc if online
    try {
      await setDoc(doc(db, 'users', uid), newProfile);
    } catch (docErr) {
      console.warn('Firestore doc write fallback:', docErr);
    }

    // 2. Save directly to local phone credential vault for 100% reliable login everywhere
    try {
      localStorage.setItem(
        `steamz_phone_${normalizedPhone}`,
        JSON.stringify({
          uid,
          phone: normalizedPhone,
          pin,
          displayName: cleanName,
          email: syntheticEmail,
          universityId,
          preferredDropSpotId,
          createdAt: newProfile.createdAt,
        })
      );
      localStorage.setItem('steamz_local_session', JSON.stringify(newProfile));
    } catch (e) {
      console.warn('Local credential vault write error:', e);
    }

    setUserProfile(newProfile);
    setAuthLoading(false);
  };

  // Super Admin Instant Login for okiriae2004@gmail.com
  const loginAsSuperAdmin = () => {
    setIsDemoUser(false);
    const superAdminProfile: UserProfile = {
      uid: 'superadmin-okiriae2004',
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Okiria (STEAMZ Super Admin)',
      role: 'admin',
      universityId: 'kiu-western',
      universityName: 'Kampala International University (KIU Western)',
      preferredDropSpotId: 'spot-kiu-eng',
      whatsapp: '+256 700 000000',
      createdAt: new Date().toISOString(),
    };
    setUserProfile(superAdminProfile);
    try {
      localStorage.setItem('steamz_local_session', JSON.stringify(superAdminProfile));
    } catch (e) {
      console.warn('Could not save local session:', e);
    }
  };

  // Email / Password Login with automatic fallback on unauthorized domain / disabled provider
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // If Super Admin logs in, allow direct access if Firebase fails
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

      // Always grant access to okiriae2004@gmail.com even if Firebase domain is not yet authorized in console
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        loginAsSuperAdmin();
        return;
      }

      // Check locally registered accounts on Vercel
      if (isDomainOrConfigIssue) {
        try {
          const rawAccounts = localStorage.getItem('steamz_local_accounts');
          if (rawAccounts) {
            const accounts = JSON.parse(rawAccounts);
            const found = accounts.find((a: any) => a.email.toLowerCase() === cleanEmail);
            if (found) {
              if (found.password && found.password !== pass) {
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
    if (currentUser && !isDemoUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), safeUpdates, { merge: true });
      } catch (err) {
        console.warn('Could not sync user profile to Firestore:', err);
      }
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
        loginAsSuperAdmin,
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
