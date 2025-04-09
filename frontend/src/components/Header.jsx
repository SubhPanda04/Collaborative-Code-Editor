import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setTheme, setCurrentFile, closeFile, setIsAIEnabled,setOutputContent, setIsCompiling  } from '../redux/slices/editorSlice';
import { FaPlay, FaCode, FaUsers, FaTimes, FaCopy, FaCheck, FaRobot } from 'react-icons/fa';
import { toast } from 'react-hot-toast'; // Add this import for toast notifications
import { compileCode } from '../utils/compilecode';

const Header = () => {
  const { folderId, fileId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Fix the destructuring here
  const { currentFile, openFiles, unsavedChanges, selectedTheme, isAIEnabled, activeFiles, inputContent } = useSelector((state) => state.editor);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const themes = ['vs-dark', 'light', 'hc-black'];

  // Modified room handling approach
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      setCurrentRoomId(roomParam);
      console.log("Found existing room in URL:", roomParam);
    } else {
      // Only create a new room ID if one doesn't exist
      const newRoomId = uuidv4().substring(0, 8);
      setCurrentRoomId(newRoomId);
      console.log("Created new room ID:", newRoomId);
      
      // Don't automatically add room to URL - wait for explicit sharing
    }
  }, []);

  const joinRoom = (roomId) => {
    console.log('Joining room:', roomId);
    // Additional room joining logic can be added here
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
  
  // Modified share room function
  const handleShareRoom = () => {
    // Always use the current room ID
    if (currentRoomId) {
      // First ensure the room ID is in the URL
      if (!window.location.search.includes('room=')) {
        const newPath = `${window.location.pathname}?room=${currentRoomId}`;
        window.history.pushState(null, '', newPath);
      }
      
      // Create the shareable URL with the ngrok domain
      const ngrokDomain = 'd2c5-103-92-44-199.ngrok-free.app';
      const shareableUrl = `https://${ngrokDomain}/editor/${folderId}/${fileId}?room=${currentRoomId}`;
      
      navigator.clipboard.writeText(shareableUrl)
        .then(() => {
          setCopied(true);
          toast.success('Room link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast.error('Failed to copy link');
        });
    }
  };

  const handleAIToggle = (e) => {
    dispatch(setIsAIEnabled(e.target.checked));
  };

  const handleRunCode = async () => {
    if (!currentFile) return;
    try {
      const code = activeFiles[currentFile.id];
      const fileName = currentFile.name;
      const extension = fileName.split('.').pop().toLowerCase();
      const input = inputContent;

      dispatch(setIsCompiling(true));

      const result = await compileCode({ code, language: extension, input });

      const output =
        result.stdout
          ? atob(result.stdout)
          : result.stderr
            ? atob(result.stderr)
            : result.compile_output
              ? atob(result.compile_output)
              : 'No output';

      dispatch(setOutputContent(output));
    } catch (error) {
      dispatch(setOutputContent('Error: ' + error.message));
    } finally {
      dispatch(setIsCompiling(false));
    }
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
            onClick={handleRunCode}
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