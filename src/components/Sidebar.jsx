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

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch(extension) {
      case 'html': return <FaHtml5 className="text-[#E44D26]" size={16} />;
      case 'css': return <FaCss3 className="text-[#264DE4]" size={16} />;
      case 'js': return <FaJs className="text-[#F7DF1E]" size={16} />;
      case 'jsx': return <FaJs className="text-[#61DAFB]" size={16} />;
      case 'ts': return <SiTypescript className="text-[#3178C6]" size={16} />;
      case 'tsx': return <SiTypescript className="text-[#3178C6]" size={16} />;
      case 'py': return <FaPython className="text-[#3776AB]" size={16} />;
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
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderContents = (parentFolderId = null, level = 0) => {
    const folderItems = folders.filter(f => f.parentFolderId === parentFolderId);
    const fileItems = files.filter(f => f.folderId === parentFolderId);

    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-4' : ''}`}>
        {/* Root level files and folders */}
        {level === 0 && (
          <>
            {/* Root level files */}
            {files.filter(f => !f.folderId).map(file => (
              <FileItem 
                key={file.id}
                file={file}
                onDelete={onDeleteFile}
                onSelect={onSelectFile}
                isActive={currentFile?.id === file.id}
                icon={getFileIcon(file.name)}
                level={level}
                isSaving={savingFileId === file.id}
              />
            ))}
            
            {/* Root level folders */}
            {folders.filter(f => !f.parentFolderId).map(folder => (
              <div key={folder.id} className="space-y-1">
                <div 
                  className="flex items-center justify-between group p-2 rounded-lg hover:bg-[#132F4C] 
                  transition-colors cursor-pointer"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4">
                      {expandedFolders.has(folder.id) ? (
                        <FaChevronDown size={12} />
                      ) : (
                        <FaChevronRight size={12} />
                      )}
                    </span>
                    <FaFolderOpen className="text-gray-400" size={20} />
                    <span className="font-medium tracking-wide">{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFile(folder.id);
                      }}
                      className="text-gray-400"
                      title="New File"
                    >
                      <FaFile size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFolder(folder.id);
                      }}
                      className="text-gray-400"
                      title="New Subfolder"
                    >
                      <FaFolder size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="text-red-500"
                      title="Delete Folder"
                    >
                      <FaTrash size={14} />
                    </motion.button>
                  </div>
                </div>
                {expandedFolders.has(folder.id) && (
                  <div className="ml-6 border-l border-[#132F4C] pl-2">
                    {renderFolderContents(folder.id, level + 1)}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Nested files and folders */}
        {level > 0 && (
          <>
            {fileItems.map(file => (
              <FileItem 
                key={file.id}
                file={file}
                onDelete={onDeleteFile}
                onSelect={onSelectFile}
                isActive={currentFile?.id === file.id}
                icon={getFileIcon(file.name)}
                level={level}
                isSaving={savingFileId === file.id}
              />
            ))}
            {folderItems.map(folder => (
              <div key={folder.id} className="space-y-1">
                <div 
                  className="flex items-center justify-between group p-2 rounded-lg hover:bg-[#132F4C] 
                  transition-colors cursor-pointer"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4">
                      {expandedFolders.has(folder.id) ? (
                        <FaChevronDown size={12} />
                      ) : (
                        <FaChevronRight size={12} />
                      )}
                    </span>
                    <FaFolderOpen className="text-gray-400" size={20} />
                    <span className="font-medium tracking-wide">{folder.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFile(folder.id);
                      }}
                      className="text-gray-400"
                      title="New File"
                    >
                      <FaFile size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFolder(folder.id);
                      }}
                      className="text-gray-400"
                      title="New Subfolder"
                    >
                      <FaFolder size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="text-red-500"
                      title="Delete Folder"
                    >
                      <FaTrash size={14} />
                    </motion.button>
                  </div>
                </div>
                {expandedFolders.has(folder.id) && (
                  <div className="ml-6 border-l border-[#132F4C] pl-2">
                    {renderFolderContents(folder.id, level + 1)}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 h-full bg-[#0A1929] text-white overflow-y-auto flex flex-col">
      {/* Explorer Section */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold tracking-wide">Explorer</h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCreateFile()}
              className="p-2 bg-[#1E88E5] rounded-lg hover:bg-[#1976D2] transition-colors"
              title="New File"
            >
              <FaFileCode size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCreateFolder()}
              className="p-2 bg-[#1E88E5] rounded-lg hover:bg-[#1976D2] transition-colors"
              title="New Folder"
            >
              <FaFolder size={16} />
            </motion.button>
          </div>
        </div>

        {/* Render files and folders */}
        {renderFolderContents()}
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
      <AnimatePresence>
        {isSaving && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-yellow-500 text-xs ml-2"
          >
            saving...
          </motion.span>
        )}
      </AnimatePresence>
    </div>
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