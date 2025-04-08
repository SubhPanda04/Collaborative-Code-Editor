import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './container/index.jsx';
import EditorPage from './container/EditorPage.jsx';
import { Provider } from 'react-redux';
import store from './redux/store.jsx';
import { Toaster } from 'react-hot-toast';

const AppContent = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/home/*" element={<Home />} />
        <Route path="/editor/:folderId/:fileId?" element={<EditorPage />} />
        <Route path="/" element={<Navigate to="/home/auth" replace />} />
        <Route path="*" element={<Navigate to="/home/auth" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <Suspense fallback={<div>Loading...</div>}>
        <AppContent />
      </Suspense>
    </Provider>
  );
};

export default App;
