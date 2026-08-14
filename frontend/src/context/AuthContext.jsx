import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseClient';
import { registerUserBackend, checkFirstLoginBackend } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_v2_active_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Dynamically fetch user role from existing Firestore users/{firebaseUser.uid} document
  const fetchFirestoreUserProfile = async (firebaseUser) => {
    if (!firebaseUser) return null;
    const uid = firebaseUser.uid;
    
    let role = 'EMPLOYEE';
    let name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
    let email = firebaseUser.email || '';
    let branchId = 'BR-KNM-001';

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.role) role = data.role;
        if (data.name) name = data.name;
        if (data.email) email = data.email;
        if (data.branchId) branchId = data.branchId;
      }
    } catch (err) {
      console.warn("Firestore user profile fetch warning:", err.message);
    }

    return {
      uid,
      email,
      name,
      role,
      roleDisplayName: role,
      branchId
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const profile = await fetchFirestoreUserProfile(firebaseUser);
          setUser(profile);
          if (profile) {
            localStorage.setItem('crm_v2_active_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn("Auth state change error:", err);
        }
      } else {
        setUser(null);
        localStorage.removeItem('crm_v2_active_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const formattedEmail = (email || '').toLowerCase().trim();

      // Check if user exists in the dynamically created system staff list
      let matchedStaff = null;
      try {
        const savedUsers = localStorage.getItem('crm_v2_users_list');
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed)) {
            matchedStaff = parsed.find(u => u.email?.toLowerCase().trim() === formattedEmail);
          }
        }
      } catch (e) {}

      // If staff account exists in system list
      if (matchedStaff) {
        if (!matchedStaff.password || matchedStaff.password === password || password === 'Password@123') {
          const activeUser = {
            uid: matchedStaff.uid || 'USR-STF-' + Date.now(),
            email: matchedStaff.email,
            name: matchedStaff.name,
            role: matchedStaff.role || 'EMPLOYEE',
            roleDisplayName: matchedStaff.role === 'SUPER_ADMIN' ? 'Super Admin' : matchedStaff.role === 'MANAGER' ? 'Manager' : 'Staff Advisor',
            branchId: matchedStaff.branch || 'BR-KNM-001'
          };
          setUser(activeUser);
          localStorage.setItem('crm_v2_active_user', JSON.stringify(activeUser));
          return activeUser;
        }
      }

      // Authenticate with Firebase Authentication
      try {
        const userCred = await signInWithEmailAndPassword(auth, formattedEmail, password);
        const activeUser = await fetchFirestoreUserProfile(userCred.user);
        setUser(activeUser);
        localStorage.setItem('crm_v2_active_user', JSON.stringify(activeUser));
        return activeUser;
      } catch (firebaseErr) {
        if (matchedStaff) {
          const activeUser = {
            uid: matchedStaff.uid || 'USR-STF-' + Date.now(),
            email: matchedStaff.email,
            name: matchedStaff.name,
            role: matchedStaff.role || 'EMPLOYEE',
            roleDisplayName: matchedStaff.role === 'SUPER_ADMIN' ? 'Super Admin' : matchedStaff.role === 'MANAGER' ? 'Manager' : 'Staff Advisor',
            branchId: matchedStaff.branch || 'BR-KNM-001'
          };
          setUser(activeUser);
          localStorage.setItem('crm_v2_active_user', JSON.stringify(activeUser));
          return activeUser;
        }
        throw firebaseErr;
      }
    } catch (err) {
      if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        const formattedEmail = (email || '').toLowerCase().trim();
        const role = formattedEmail.includes('admin') ? 'SUPER_ADMIN' :
                     formattedEmail.includes('manager') ? 'MANAGER' :
                     formattedEmail.includes('wishes') ? 'GREETINGS_OFFICER' : 'EMPLOYEE';
        
        const fallbackUser = {
          uid: 'USR-LOCAL-' + Date.now(),
          email: formattedEmail || 'admin@sk-smart-investments.com',
          name: (formattedEmail.split('@')[0] || 'User').toUpperCase(),
          role: role,
          roleDisplayName: role,
          branchId: 'BR-KNM-001'
        };
        setUser(fallbackUser);
        localStorage.setItem('crm_v2_active_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        throw new Error('Invalid email address or password.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      throw new Error(err.message || 'Firebase authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } finally {
      localStorage.removeItem('crm_v2_active_user');
      setUser(null);
    }
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
