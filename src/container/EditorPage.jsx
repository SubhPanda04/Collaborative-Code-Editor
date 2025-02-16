import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';
import Header from '../components/Header';
import { FaChevronLeft, FaChevronRight, FaTerminal, FaKeyboard, FaTimes, FaExpandAlt, FaCompressAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Code2 } from 'lucide-react';

const EditorPage = () => {
  const { folderId, fileId } = useParams();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [roomId] = useState('room-xyz-123');
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
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [playgrounds, setPlaygrounds] = useState([]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setFiles(savedData.files || []);
      setFolders(savedData.folders || []);
    }
  }, []);

  // Load file and folder data when component mounts
  useEffect(() => {
    const loadFileAndFolder = async () => {
      try {
        if (!folderId || !fileId) return;
        
        const fileRef = doc(db, "files", `${folderId}_${fileId}`);
        const fileSnap = await getDoc(fileRef);
        
        if (fileSnap.exists()) {
          const fileData = fileSnap.data();
          setCurrentFile(fileData);
          setFileContent(fileData.content || '');
          setSelectedLanguage(fileData.language || 'javascript');
          
          // Set the entire folder structure from fileData
          if (fileData.folderStructure) {
            setPlaygrounds(fileData.folderStructure);
          }
        } else {
          console.error("File not found!");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading file:", error);
        setLoading(false);
      }
    };

    loadFileAndFolder();
  }, [folderId, fileId]);

  const handleFileContentChange = useCallback(async (newContent) => {
    if (currentFile) {
      try {
        const fileRef = doc(db, "files", `${currentFile.folderId}_${currentFile.id}`);
        await setDoc(fileRef, {
          ...currentFile,
          content: newContent,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        setUnsavedChanges(false);
      } catch (error) {
        console.error("Error saving file:", error);
      }
    }
  }, [currentFile]);

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

  // Handle content changes and save to Firebase
  const handleContentChange = async (newContent) => {
    setFileContent(newContent);
    setUnsavedChanges(true);
    
    try {
      if (folderId && fileId) {
        const fileRef = doc(db, "files", `${folderId}_${fileId}`);
        await setDoc(fileRef, {
          content: newContent,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error saving content:", error);
    }
  };

  useEffect(() => {
    let saveTimeout;

    const autoSave = () => {
      if (fileContent && folderId && fileId) {
        const fileRef = doc(db, "files", `${folderId}_${fileId}`);
        setDoc(fileRef, {
          content: fileContent,
          updatedAt: new Date().toISOString()
        }, { merge: true })
        .then(() => {
          setUnsavedChanges(false);
        })
        .catch((error) => {
          console.error("Error auto-saving:", error);
        });
      }
    };

    if (unsavedChanges) {
      saveTimeout = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of no changes
    }

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [fileContent, folderId, fileId, unsavedChanges]);

  // Add the getLanguageColor function to EditorPage
  const getLanguageColor = (language) => {
    const colors = {
      javascript: 'text-yellow-500',
      python: 'text-blue-500',
      cpp: 'text-blue-600',
      java: 'text-red-500',
      typescript: 'text-blue-400',
      html: 'text-orange-500',
      css: 'text-blue-300'
    };
    return colors[language] || 'text-blue-500';
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#1E4976]">
      <Header 
        selectedLanguage={currentFile?.language || selectedLanguage}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        currentFile={currentFile}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <Sidebar
            files={playgrounds}
            folders={playgrounds}
            currentFile={currentFile}
            onSelectFile={(file) => {
              if (file && file.id) {
                navigate(`/editor/${file.folderId}/${file.id}`);
              }
            }}
            savingFileId={savingFileId}
          />
        </div>
        
        <div className="flex-1 flex flex-col ml-64">
          <div className="flex-1">
            <Editor 
              language={currentFile?.language || selectedLanguage}
              theme={selectedTheme}
              value={fileContent}
              onChange={handleContentChange}
            />
          </div>
          
          {/* Input/Output Container */}
          <div className="h-1/3 flex">
            {/* Input Container */}
            {isInputVisible && (
              <div className={`${isInputExpanded ? 'w-full' : 'w-1/2'} bg-[#1E1E1E] border-t border-[#333]`}>
                <div className="flex justify-between items-center p-2 border-b border-[#333]">
                  <div className="flex items-center gap-2">
                    <FaKeyboard className="text-gray-400" />
                    <span className="text-gray-300">Input</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsInputExpanded(!isInputExpanded)}>
                      {isInputExpanded ? <FaCompressAlt className="text-gray-400" /> : <FaExpandAlt className="text-gray-400" />}
                    </button>
                    <button onClick={() => setIsInputVisible(false)}>
                      <FaTimes className="text-gray-400" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-[calc(100%-40px)] bg-[#1E1E1E] text-white p-2 resize-none outline-none"
                />
              </div>
            )}
            
            {/* Output Container */}
            {isOutputVisible && (
              <div className={`${isOutputExpanded ? 'w-full' : 'w-1/2'} bg-[#1E1E1E] border-t border-l border-[#333]`}>
                <div className="flex justify-between items-center p-2 border-b border-[#333]">
                  <div className="flex items-center gap-2">
                    <FaTerminal className="text-gray-400" />
                    <span className="text-gray-300">Output</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsOutputExpanded(!isOutputExpanded)}>
                      {isOutputExpanded ? <FaCompressAlt className="text-gray-400" /> : <FaExpandAlt className="text-gray-400" />}
                    </button>
                    <button onClick={() => setIsOutputVisible(false)}>
                      <FaTimes className="text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-[calc(100%-40px)] bg-[#1E1E1E] text-white p-2 overflow-auto">
                  {output}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage; 