import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './container/index.jsx';
import EditorPage from './container/EditorPage.jsx';
import { Provider } from 'react-redux';
import store from './redux/store.jsx';
import { ProtectedRoute } from './components/index.jsx';
import './config/editorConfig.jsx';

const AppContent = () => {
  return (
    <Routes>
      <Route path="/home/*" element={<Home />} />
      <Route 
        path="/editor/:folderId/:fileId" 
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/home/auth" replace />} />
      <Route path="*" element={<Navigate to="/home/auth" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <div className="w-screen h-screen">
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          <AppContent />
        </Suspense>
      </div>
    </Provider>
  );
};

export default App;
