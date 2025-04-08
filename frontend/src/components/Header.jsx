import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setTheme, setCurrentFile, closeFile, setIsAIEnabled } from '../redux/slices/editorSlice';
import { FaPlay, FaCode, FaUsers, FaTimes, FaCopy, FaCheck, FaRobot } from 'react-icons/fa';

const Header = () => {
  const { folderId, fileId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {selectedTheme, isAIEnabled} = useSelector((state) => state.editor.selectedTheme);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const themes = ['vs-dark', 'light', 'hc-black'];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      setCurrentRoomId(roomParam);
    } else {
      const newRoomId = uuidv4().substring(0, 8);
      setCurrentRoomId(newRoomId);
      const newSearchParams = new URLSearchParams(window.location.search);
      newSearchParams.set('room', newRoomId);
      const newPath = `${window.location.pathname}${newSearchParams.toString() ? '?' : ''}${newSearchParams.toString()}`;
      window.history.pushState(null, '', newPath);
    }
  }, []);

  const joinRoom = (roomId) => {
    console.log('Joining room:', roomId);
  };

  useEffect(() => {
    if (currentRoomId) {
      joinRoom(currentRoomId);
    }
  }, [currentRoomId]);

  const handleThemeChange = (e) => {
    const theme = e.target.value;
    dispatch(setTheme(theme));
  };

  const [copied, setCopied] = useState(false);
  
  const handleShareRoom = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      // Keep the URL sharing functionality but remove any server communication
      const shareableUrl = window.location.href;
      
      navigator.clipboard.writeText(shareableUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  const handleAIToggle = (e) => {
    dispatch(setIsAIEnabled(e.target.checked));
  };

  return (
    <div className="w-full flex flex-col bg-[#031d38] border-b border-[#1E4976]">
      {/* Main header */}
      <div className="w-full h-16 flex items-center justify-between px-6">
        {/* Left section */}
        <div className="flex items-center gap-6 flex-nowrap">
          <span className="text-white text-xl font-bold whitespace-nowrap flex items-center gap-2">
            <FaCode className="text-blue-400" />
            CodeSync
          </span>
          
          <motion.select 
            whileTap={{ scale: 0.97 }}
            value={selectedTheme}
            onChange={handleThemeChange}
            className="bg-[#132F4C] text-white px-3 py-2 rounded-lg text-sm border border-[#1E4976]
            focus:outline-none focus:ring-2 focus:ring-[#1E88E5] cursor-pointer w-[120px]"
          >
            {themes.map(theme => (
              <option key={theme} value={theme} className="py-1">
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </motion.select>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* AI Toggle */}
          <div className="flex items-center gap-2 bg-[#132F4C] px-4 py-2 rounded-lg border border-[#1E4976]">
            <FaRobot className="text-purple-400" />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAIEnabled}
                onChange={handleAIToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 
                peer-focus:ring-purple-800 rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600">
              </div>
              <span className="ml-3 text-sm font-medium text-white">AI Assistant</span>
            </label>
          </div>

          {/* Share Room Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleShareRoom}
            className="flex items-center gap-2 bg-[#132F4C] px-4 py-2 rounded-lg border border-[#1E4976] 
            hover:bg-[#1a3a5c] transition-colors duration-200"
          >
            {copied ? (
              <>
                <FaCheck className="text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <FaUsers className="text-blue-400" />
                <span className="text-white">Share Room</span>
              </>
            )}
          </motion.button>

          {/* Run Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => console.log('Run code functionality to be implemented')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg 
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <FaPlay className="text-sm" />
            <span>Run</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Header;