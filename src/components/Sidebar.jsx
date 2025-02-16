import React, { useState } from 'react';
import { 
  FaFolder, 
  FaFolderOpen, 
  FaFileCode, 
  FaTrash,
  FaHtml5,
  FaCss3,
  FaJs,
  FaPython,
  FaJava,
  FaMarkdown,
  FaFile,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { SiTypescript, SiCplusplus, SiRust, SiGo } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ 
  files, 
  folders, 
  onCreateFile, 
  onCreateFolder, 
  onDeleteFile, 
  onDeleteFolder,
  onSelectFile,
  currentFile,
  savingFileId
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const getFileIcon = (file) => {
    if (!file || !file.language) return <FaFileCode className="text-[#4B5563]" size={16} />;
    
    switch(file.language.toLowerCase()) {
      case 'html': return <FaHtml5 className="text-[#E44D26]" size={16} />;
      case 'css': return <FaCss3 className="text-[#264DE4]" size={16} />;
      case 'javascript': return <FaJs className="text-[#F7DF1E]" size={16} />;
      case 'typescript': return <SiTypescript className="text-[#3178C6]" size={16} />;
      case 'python': return <FaPython className="text-[#3776AB]" size={16} />;
      case 'java': return <FaJava className="text-[#007396]" size={16} />;
      case 'cpp': return <SiCplusplus className="text-[#00599C]" size={16} />;
      case 'rs': return <SiRust className="text-[#000000]" size={16} />;
      case 'go': return <SiGo className="text-[#00ADD8]" size={16} />;
      case 'md': return <FaMarkdown className="text-white" size={16} />;
      default: return <FaFileCode className="text-[#4B5563]" size={16} />;
    }
  };

  const handleCreateFile = (folderId = null) => {
    const fileName = prompt('Enter file name (include extension, e.g., main.js):');
    if (fileName) onCreateFile(fileName, folderId);
  };

  const handleCreateFolder = (parentFolderId = null) => {
    const folderName = prompt('Enter folder name:');
    if (folderName) onCreateFolder(folderName, parentFolderId);
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderContents = (folder) => {
    const isExpanded = expandedFolders.has(folder.id);
    
    return (
      <div key={folder.id} className="space-y-1">
        <div 
          className="flex items-center justify-between group p-2 rounded-lg hover:bg-[#132F4C] 
          transition-colors cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <FaFolderOpen className="text-yellow-400" /> : <FaFolder className="text-yellow-400" />}
            <span className="text-white">{folder.title}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-4">
            {folder.items?.map(file => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer
                  ${currentFile?.id === file.id ? 'bg-[#132F4C]' : 'hover:bg-[#132F4C]'}`}
                onClick={() => onSelectFile?.(file)}
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span className="text-white font-mono">
                    {file.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed top-16 left-0 w-64 h-[calc(100vh-64px)] bg-[#1E1E1E] p-4 overflow-y-auto border-r border-[#132F4C]">
      <div className="space-y-2">
        {folders?.map(renderFolderContents)}
      </div>
    </div>
  );
};

const FileItem = ({ file, onDelete, onSelect, isActive, icon, level = 0, isSaving }) => (
  <div 
    className={`flex items-center justify-between group py-2 px-3 rounded-lg cursor-pointer
    transition-colors ${isActive ? 'bg-[#175b80]' : 'hover:bg-[#132F4C]'} ml-6`}
    onClick={() => onSelect(file)}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium tracking-wide">{file.name}</span>
      {isSaving && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-yellow-500 text-xs ml-2"
        >
          saving...
        </motion.span>
      )}
    </div>
    {onDelete && (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file.id);
        }}
        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <FaTrash size={14} />
      </motion.button>
    )}
  </div>
);

const QuickActionButton = ({ icon, text }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="flex items-center gap-2 p-2 bg-[#132F4C] rounded-lg hover:bg-[#1E4976] 
    transition-colors text-sm font-medium w-full"
  >
    {icon}
    <span>{text}</span>
  </motion.button>
);

export default Sidebar; 