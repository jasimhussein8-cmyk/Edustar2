/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import Layout from './components/Layout';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentDashboard from './components/ParentDashboard';
import StudentDashboard from './components/StudentDashboard';
import AttendanceTracker from './components/AttendanceTracker';
import Messaging from './components/Messaging';
import GradeManager from './components/GradeManager';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // New user - wait for profile setup
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'New User',
            email: firebaseUser.email || '',
            role: 'student', // Default, will be changed in setup
            createdAt: new Date().toISOString(),
            isProfileComplete: false,
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={
            user ? (
              user.isProfileComplete ? (
                <Layout user={user} />
              ) : (
                <ProfileSetup user={user} onComplete={(updatedUser) => setUser(updatedUser)} />
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        >
          <Route
            index
            element={
              user?.role === 'admin' ? (
                <AdminDashboard />
              ) : user?.role === 'teacher' ? (
                <TeacherDashboard />
              ) : user?.role === 'parent' ? (
                <ParentDashboard />
              ) : (
                <StudentDashboard />
              )
            }
          />
          <Route path="/attendance" element={<AttendanceTracker />} />
          <Route path="/messages" element={<Messaging />} />
          <Route path="/grades" element={<GradeManager />} />
        </Route>
      </Routes>
    </Router>
  );
}

