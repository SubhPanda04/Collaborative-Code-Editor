import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setTheme, setCurrentFile, closeFile } from '../redux/slices/editorSlice';
import { FaPlay, FaCode, FaUsers, FaTimes } from 'react-icons/fa';

const Header = () => {
  const dispatch = useDispatch();
  const { currentFile, openFiles, unsavedChanges, selectedTheme } = useSelector((state) => state.editor);
  const themes = ['vs-dark', 'light', 'hc-black'];
  const roomId = "1q2w3e4r5t6y"; // Replace with actual room ID from your state

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    if (newTheme) {
      dispatch(setTheme(newTheme));
    }
  };

  const handleFileTabClick = (file) => {
    dispatch(setCurrentFile(file));
  };

  const handleCloseFile = (e, fileId) => {
    e.stopPropagation();
    dispatch(closeFile(fileId));
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
          {/* Room ID */}
          <div className="flex items-center gap-2 bg-[#132F4C] px-4 py-2 rounded-lg border border-[#1E4976]">
            <FaUsers className="text-blue-400" />
            <span className="text-white text-sm">Room ID: {roomId}</span>
          </div>

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