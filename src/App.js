import React,{ useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Home } from './container';
import { auth,db } from './config/firebase.config';
import { doc, getDoc } from  "firebase/firestore"

const App = () => {
  const navigate = useNavigate();



  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (userCred) => {
      if (userCred) {
        const userDoc = await getDoc(doc(db, "users", userCred.uid));
        if (!userDoc.exists()) {
          console.log("User data not found in Firestore. Redirecting to sign-up.");
          navigate("/home/auth", { replace: true });
        } else {
          console.log("User data:", userDoc.data());
        }
      } else {
        navigate("/home/auth", { replace: true });
      }
    });
  
    return () => unsubscribe();
  }, [navigate]);
  return (
    <div className='w-screen h-screen flex items-start justify-start overflow-hidden'>
      <Routes>
        <Route path="/home/*" element={<Home />} />

        {/*If the route is not matching */}
        <Route path="*" element={<Navigate to={"/home"} />}/>
      </Routes>
    </div>
  )
}

export default App
