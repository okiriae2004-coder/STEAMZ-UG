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
          }
        } catch (error) {
          console.warn('Error fetching or creating user profile in Firestore:', error);
          // Fallback in-memory profile with strictly authorized role
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'STEAMZ Member',
            photoURL: user.photoURL || undefined,
            role: authorizedRole,
            universityId: 'kiu-western',
            universityName: 'Kampala International University (KIU Western)',
            preferredDropSpotId: 'spot-kiu-eng',
            whatsapp: '',
          });
        }
      } else {
        if (!isDemoUser) {
          setUserProfile(null);
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
      } else {
        const data = snapshot.data() as UserProfile;
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          data.role = 'admin';
        } else if (data.role !== authorizedRole) {
          data.role = authorizedRole;
        }
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Email / Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email Login Error:', error);
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
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = cred.user;
      await updateProfile(user, { displayName });

      const assignedRole = resolveUserRole(email);

      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        displayName: displayName || email.split('@')[0],
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
    } catch (error) {
      console.error('Signup Error:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setAuthLoading(true);
    try {
      if (!isDemoUser) {
        await signOut(auth);
      }
      setCurrentUser(null);
      setUserProfile(null);
      setIsDemoUser(false);
    } catch (error) {
      console.error('Sign Out Error:', error);
    } finally {
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
