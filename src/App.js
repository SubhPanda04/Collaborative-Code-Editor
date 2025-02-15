import React,{ useEffect } from 'react';
import { Navigate, Route, Routes,  useLocation,  useNavigate } from 'react-router-dom';
import { Home } from './container';
import { auth,db } from './config/firebase.config';
import { doc, getDoc } from  "firebase/firestore"
import EditorPage from './container/EditorPage';
//import { useDispatch } from 'react-redux';
//import { SET_USER } from './context/actions/userActions';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current route
  
  //const dispatch = useDispatch();



  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (userCred) => {
      if (userCred) {
        const userDoc = await getDoc(doc(db, "users", userCred.uid))
        if (!userDoc.exists()) {
          console.log("User data not found in Firestore. Redirecting to sign-up.");
          navigate("/home/auth", { replace: true });
        } else {
          console.log("User data:", userDoc.data());
          if (!location.pathname.startsWith("/editor/")) {
            navigate("/home/projects");
          }
        }
      } else {
        navigate("/home/auth", { replace: true });
      }
    });
  
    return () => unsubscribe();
  }, [navigate,location.pathname]);
  return (
    <div>
      <Routes>
        <Route path="/home/*" element={<Home />} />
        <Route path="/editor/:folderId/:fileId" element={<EditorPage />} />

        {/*If the route is not matching */}
        <Route path="*" element={<Navigate to={"/home"} />}/>
        
      </Routes>
    </div>
  );
}

export default App;
