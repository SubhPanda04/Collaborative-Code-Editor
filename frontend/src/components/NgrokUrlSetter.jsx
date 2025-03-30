import React, { useState, useEffect } from 'react';
import { FaLink, FaSave, FaTimes, FaCheck } from 'react-icons/fa';

const NgrokUrlSetter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [ngrokUrl, setNgrokUrl] = useState(localStorage.getItem('ngrokUrl') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (ngrokUrl) {
      // Remove https:// or http:// if present
      let cleanUrl = ngrokUrl;
      if (cleanUrl.startsWith('https://')) {
        cleanUrl = cleanUrl.substring(8);
      } else if (cleanUrl.startsWith('http://')) {
        cleanUrl = cleanUrl.substring(7);
      }
      
      localStorage.setItem('ngrokUrl', cleanUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // Add keyboard shortcut (Ctrl+Shift+N) to open the dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 z-50"
        title="Set ngrok URL (Ctrl+Shift+N)"
      >
        <FaLink />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#031d38] p-6 rounded-lg shadow-xl w-full max-w-md border border-[#1E4976]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Set ngrok URL</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">
          Enter your ngrok URL (without https://) to enable sharing your workspace.
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={ngrokUrl}
            onChange={(e) => setNgrokUrl(e.target.value)}
            placeholder="e.g. 1a2b-103-92-44-199.ngrok-free.app"
            className="flex-1 bg-[#132F4C] text-white px-3 py-2 rounded-lg border border-[#1E4976] focus:outline-none focus:border-blue-500"
          />
          
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {saved ? <FaCheck /> : <FaSave />}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          <p>Current ngrok error: <span className="text-red-400">ERR_NGROK_8012</span></p>
          <p className="mt-1">This means ngrok can't connect to your local server at port 8080.</p>
          <p className="mt-2">Make sure your backend server is running on port 8080 before using ngrok.</p>
        </div>
      </div>
    </div>
  );
};

export default NgrokUrlSetter;