import { Navigate, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // If no user is logged in, redirect to auth page
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <div>
      <Routes>
        {/* Default route redirects to auth */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* Auth route
        <Route path="/auth" element={
          user ? <Navigate to="/projects" replace /> : <Auth />
        } /> */}

        {/* Protected route
        <Route path="/projects" element={
          user ? <Projects /> : <Navigate to="/auth" replace />
        } /> */}
      </Routes>
    </div>
  );
}

export default App;
