import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

// Mock User type to replace firebase/auth User
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('top_dating_user');
    if (storedUser) {
      const authUser = JSON.parse(storedUser) as MockUser;
      setUser(authUser);
      fetchProfile(authUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: MockUser) => {
    localStorage.setItem('top_dating_user', JSON.stringify(userData));
    setUser(userData);
    fetchProfile(userData.uid);
  };

  const logout = () => {
    localStorage.removeItem('top_dating_user');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const updatedData = {
      ...data,
      uid: user.uid,
      lastActive: serverTimestamp(),
    };
    await setDoc(docRef, updatedData, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...updatedData } as UserProfile : null));
  };

  return { user, profile, loading, updateProfile, login, logout };
}
