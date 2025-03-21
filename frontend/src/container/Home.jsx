import React, { useEffect, useState } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Projects, SignUp } from '../container';
import { auth } from '../config/firebase.config';

const Home = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      
      // Store auth state in localStorage
      if (currentUser) {
        localStorage.setItem('userUID', currentUser.uid);
        localStorage.setItem('userName', currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
      }
    });

    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen flex flex-col items-center justify-start'>
      <div className='w-full h-full flex flex-col items-start justify-start'>
        <div className='w-full h-full'>
          <Routes>
            <Route 
              path="/auth" 
              element={
                user ? (
                  <Navigate to="/home/projects" replace />
                ) : (
                  <SignUp />
                )
              } 
            />
            <Route 
              path="/projects" 
              element={
                user ? (
                  <Projects />
                ) : (
                  <Navigate to="/home/auth" replace state={{ from: location.pathname }} />
                )
              } 
            />
            <Route path="/" element={<Navigate to={user ? "/home/projects" : "/home/auth"} replace />} />
            <Route path="*" element={<Navigate to={user ? "/home/projects" : "/home/auth"} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Home;
