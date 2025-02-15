import React from 'react';
import { FaCopy, FaPlay, FaShare, FaCode } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Header = ({ 
  selectedLanguage, 
  setSelectedLanguage, 
  selectedTheme, 
  setSelectedTheme, 
  roomId, 
  currentFile,
  hasUnsavedChanges 
}) => {
  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'csharp',
    'go',
    'rust',
    'ruby',
    'php',
    'swift',
    'kotlin',
    'sql',
    'xml',
    'yaml',
    'json',
    'markdown',
    'plaintext'
  ];

  const themes = [
    'vs-dark',
    'light',
    'hc-black',
  ];

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="h-16 bg-[#0A1929] flex items-center justify-between px-6 border-b border-[#132F4C]">
      {/* Logo and Brand */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-white text-2xl font-bold tracking-wider">CodeCollab</span>
        </div>

        <div className="flex items-center gap-6">
          <motion.select 
            whileTap={{ scale: 0.97 }}
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-[#132F4C] text-white px-4 py-2 rounded-lg text-base border border-[#1E4976]
            focus:outline-none focus:ring-2 focus:ring-[#1E88E5] cursor-pointer min-w-[160px]"
          >
            {languages.map(lang => (
              <option key={lang} value={lang} className="py-2">{lang}</option>
            ))}
          </motion.select>

          <motion.select 
            whileTap={{ scale: 0.97 }}
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="bg-[#132F4C] text-white px-4 py-2 rounded-lg text-base border border-[#1E4976]
            focus:outline-none focus:ring-2 focus:ring-[#1E88E5] cursor-pointer min-w-[140px]"
          >
            {themes.map(theme => (
              <option key={theme} value={theme} className="py-2">{theme}</option>
            ))}
          </motion.select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {currentFile && (
          <div className="flex items-center gap-2">
            <span className="text-[#64B5F6] font-medium">
              {currentFile.name}
            </span>
            {hasUnsavedChanges && (
              <span className="text-yellow-500 text-sm" title="Unsaved changes (Ctrl+S to save)">●</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 bg-[#132F4C] px-4 py-2 rounded-lg border border-[#1E4976]">
          <span className="text-white text-base font-medium">Room ID: {roomId}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copyRoomId}
            className="text-[#64B5F6] hover:text-white transition-colors p-1"
          >
            <FaCopy size={18} />
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-[#1E88E5] text-white p-3 rounded-lg hover:bg-[#1976D2] transition-colors
            border border-[#1E4976]"
            title="Share"
          >
            <FaShare size={18} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-[#E44D26] text-white px-6 py-2 rounded-lg hover:bg-[#D32F2F] 
            transition-colors flex items-center gap-3 text-base font-medium border border-[#1E4976]"
          >
            <FaPlay size={16} />
            Run
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Header; 