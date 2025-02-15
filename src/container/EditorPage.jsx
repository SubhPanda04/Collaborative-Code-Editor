import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import Header from '../components/Header';
import { FaChevronLeft, FaChevronRight, FaTerminal, FaKeyboard, FaTimes, FaExpandAlt, FaCompressAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { saveToStorage, loadFromStorage } from '../utils/storage';

const EditorPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [roomId] = useState('room-xyz-123');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentFile, setCurrentFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(true);
  const [isOutputVisible, setIsOutputVisible] = useState(true);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [savingFileId, setSavingFileId] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setFiles(savedData.files || []);
      setFolders(savedData.folders || []);
    }
  }, []);

  const handleFileContentChange = useCallback((newContent) => {
    if (currentFile) {
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(f =>
          f.id === currentFile.id
            ? {
                ...f,
                content: newContent,
                updatedAt: new Date().toISOString()
              }
            : f
        );
        saveToStorage(updatedFiles, folders); // Save immediately when content changes
        return updatedFiles;
      });
      setUnsavedChanges(true);
    }
  }, [currentFile, folders]);

  const saveFile = useCallback(() => {
    if (currentFile && unsavedChanges) {
      setSavingFileId(currentFile.id);
      
      // Update the file's content and save to storage
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(f =>
          f.id === currentFile.id
            ? {
                ...f,
                updatedAt: new Date().toISOString()
              }
            : f
        );
        const success = saveToStorage(updatedFiles, folders);
        if (success) {
          setUnsavedChanges(false);
          // Clear saving indicator after a delay
          setTimeout(() => {
            setSavingFileId(null);
          }, 800);
        }
        return updatedFiles;
      });
    }
  }, [currentFile, folders, unsavedChanges]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile]);

  const handleCreateFile = useCallback((fileName, folderId = null) => {
    const newFile = {
      id: Date.now(),
      name: fileName,
      content: '',
      folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles, newFile];
      saveToStorage(updatedFiles, folders);
      return updatedFiles;
    });
    
    setCurrentFile(newFile);
    setSelectedLanguage(getFileLanguage(fileName));
  }, [folders]);

  const handleFileSelect = useCallback((file) => {
    if (unsavedChanges) {
      saveFile();
    }
    setCurrentFile(file);
    setSelectedLanguage(getFileLanguage(file.name));
  }, [unsavedChanges, saveFile]);

  const handleDeleteFile = useCallback((fileId) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(f => f.id !== fileId);
      saveToStorage(updatedFiles, folders);
      return updatedFiles;
    });
    
    if (currentFile?.id === fileId) {
      setCurrentFile(null);
    }
  }, [currentFile, folders]);

  const handleCreateFolder = useCallback((folderName, parentFolderId = null) => {
    const newFolder = {
      id: Date.now(),
      name: folderName,
      parentFolderId,
      createdAt: new Date().toISOString()
    };
    
    setFolders(prevFolders => {
      const updatedFolders = [...prevFolders, newFolder];
      saveToStorage(files, updatedFolders);
      return updatedFolders;
    });
  }, [files]);

  const handleDeleteFolder = useCallback((folderId) => {
    const folderIdsToDelete = new Set();
    
    const addFolderAndChildren = (id) => {
      folderIdsToDelete.add(id);
      folders
        .filter(f => f.parentFolderId === id)
        .forEach(f => addFolderAndChildren(f.id));
    };
    
    addFolderAndChildren(folderId);
    
    setFolders(prevFolders => {
      const updatedFolders = prevFolders.filter(f => !folderIdsToDelete.has(f.id));
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.filter(f => !folderIdsToDelete.has(f.folderId));
        saveToStorage(updatedFiles, updatedFolders);
        return updatedFiles;
      });
      return updatedFolders;
    });
    
    if (currentFile?.folderId && folderIdsToDelete.has(currentFile.folderId)) {
      setCurrentFile(null);
    }
  }, [currentFile, folders]);

  const getFileLanguage = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      cc: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      sql: 'sql',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      json: 'json',
      md: 'markdown'
    };
    return languageMap[extension] || 'plaintext';
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#1A1B26]">
      <Header 
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        roomId={roomId}
        currentFile={currentFile}
        hasUnsavedChanges={unsavedChanges}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: isSidebarOpen ? 0 : -320 }}
          className="h-full border-r border-[#2F3142]"
          transition={{ duration: 0.3 }}
        >
          <Sidebar 
            files={files}
            folders={folders}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
            onSelectFile={handleFileSelect}
            currentFile={currentFile}
            savingFileId={savingFileId}
          />
        </motion.div>

        <div className="flex-1 flex flex-col relative">
          <div className={`flex-1 ${(isInputVisible || isOutputVisible) ? 'h-[60%]' : 'h-full'}`}>
            <Editor 
              language={selectedLanguage}
              theme={selectedTheme}
              currentFile={currentFile}
              onChange={handleFileContentChange}
            />
          </div>

          {/* Input/Output Container */}
          {(isInputVisible || isOutputVisible) && (
            <div className="h-[40%] flex border-t border-[#2F3142]">
              {/* Input Panel */}
              {isInputVisible && (
                <div className={`${isOutputVisible ? 'w-1/2' : 'w-full'} 
                  border-r border-[#2F3142] flex flex-col`}
                >
                  <div className="bg-[#0A1929] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaKeyboard className="text-[#1E88E5]" />
                      <span className="text-white text-xl font-bold">Input</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsInputExpanded(!isInputExpanded)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isInputExpanded ? <FaCompressAlt size={14} /> : <FaExpandAlt size={14} />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsInputVisible(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <FaTimes size={14} />
                      </motion.button>
                    </div>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-[#1A1B26] text-white p-4 resize-none focus:outline-none 
                    font-mono text-2xl"
                    placeholder="Enter your input here..."
                  />
                </div>
              )}

              {/* Output Panel */}
              {isOutputVisible && (
                <div className={`${isInputVisible ? 'w-1/2' : 'w-full'} flex flex-col`}>
                  <div className="bg-[#0A1929] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaTerminal className="text-[#1E88E5]" />
                      <span className="text-white text-xl font-bold">Output</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOutputExpanded(!isOutputExpanded)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isOutputExpanded ? <FaCompressAlt size={14} /> : <FaExpandAlt size={14} />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOutputVisible(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <FaTimes size={14} />
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#1A1B26] text-white p-4 font-mono text-2xl overflow-auto">
                    {output || 'No output yet...'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle Buttons */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {!isInputVisible && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsInputVisible(true)}
                className="bg-[#1E88E5] text-white p-2 rounded-lg hover:bg-[#1976D2] 
                transition-colors"
                title="Show Input"
              >
                <FaKeyboard size={16} />
              </motion.button>
            )}
            {!isOutputVisible && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOutputVisible(true)}
                className="bg-[#1E88E5] text-white p-2 rounded-lg hover:bg-[#1976D2] 
                transition-colors"
                title="Show Output"
              >
                <FaTerminal size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage; 