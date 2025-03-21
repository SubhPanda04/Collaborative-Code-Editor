import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Code2 } from 'lucide-react'; // Add this import
import { 
  setCurrentFile, 
  setFileContent,
  closeFile
} from '../redux/slices/editorSlice';
import { setCurrentFolder } from '../redux/slices/fileSystemSlice';
import { setError } from '../redux/slices/uiSlice';
import { Header, Sidebar, Editor, IOPanel } from '../components';
import '../config/editorConfig'; // Import to ensure editor config is loaded
import { FaTimes } from 'react-icons/fa';

const EditorPage = () => {
  const { folderId, fileId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Add navigate hook
  const [loading, setLoading] = useState(true);
  
  // Add effect to handle back button
  useEffect(() => {
    const handleBackButton = (e) => {
      e.preventDefault();
      navigate('/home/projects');
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate]);

  // Add missing state from Redux store
  const { isInputVisible, isOutputVisible } = useSelector((state) => state.ui);
  const { openFiles, currentFile, unsavedChanges } = useSelector((state) => state.editor);

  const findFileInFolder = (items, targetFileId) => {
    for (const item of items) {
      if (item.id === targetFileId) {
        return item;
      }
      if (item.type === 'folder' && item.items) {
        const found = findFileInFolder(item.items, targetFileId);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const loadFolderAndFile = async () => {
      if (!folderId) return;

      try {
        setLoading(true);
        const folderRef = doc(db, "playgrounds", folderId);
        const folderSnap = await getDoc(folderRef);

        if (folderSnap.exists()) {
          const folderData = { id: folderSnap.id, ...folderSnap.data() };
          dispatch(setCurrentFolder(folderData));

          // Clean up any open files that don't exist in the current folder
          openFiles.forEach(file => {
            if (!findFileInFolder(folderData.items, file.id)) {
              dispatch(closeFile(file.id));
            }
          });

          // If we have a fileId, find and set the current file
          if (fileId && folderData.items) {
            const file = findFileInFolder(folderData.items, fileId);
            if (file) {
              dispatch(setCurrentFile(file));
              dispatch(setFileContent({ 
                fileId: file.id, 
                content: file.content || '' 
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error loading folder:", error);
        dispatch(setError("Failed to load folder"));
      } finally {
        setLoading(false);
      }
    };

    loadFolderAndFile();
  }, [folderId, fileId, dispatch, openFiles]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    );
  }

  const handleFileTabClick = (file) => {
    dispatch(setCurrentFile(file));
    navigate(`/editor/${folderId}/${file.id}`);
  };

  const handleCloseFile = async (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the remaining files before closing
    const remainingFiles = openFiles.filter(f => f.id !== fileId);
    
    // Close the current file first
    await dispatch(closeFile(fileId));
    
    // Handle navigation and state updates
    if (remainingFiles.length > 0) {
      const nextFile = remainingFiles[remainingFiles.length - 1];
      await dispatch(setCurrentFile(nextFile));
      navigate(`/editor/${folderId}/${nextFile.id}`, { replace: true });
    } else {
      // Explicitly set currentFile to null
      await dispatch(setCurrentFile(null));
      navigate(`/editor/${folderId}`, { replace: true });
    }
  };

  // Add this check
  if (!folderId) {
    navigate('/home/projects', { replace: true });
    return null;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#1e1e1e]">
      <Header />
      <div className="w-full h-[calc(100vh-48px)] flex">
        <div className="w-80 flex-shrink-0">
          <Sidebar folderId={folderId} />
        </div>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* File tabs section */}
          {openFiles.length > 0 && (
            <div className="w-full flex items-center overflow-x-auto bg-[#0a2744] px-2 py-1">
              {openFiles.map((file) => (
                <div 
                  key={file.id}
                  onClick={() => handleFileTabClick(file)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-t-md mr-1 cursor-pointer transition-colors duration-200 max-w-[200px] ${
                    currentFile?.id === file.id 
                      ? 'bg-[#1e1e1e] text-white' 
                      : 'bg-[#132F4C] text-gray-300 hover:bg-[#1a3a5c]'
                  }`}
                >
                  <span className="truncate text-sm">
                    {file.name} {unsavedChanges[file.id] ? '•' : ''}
                  </span>
                  <button
                    onClick={(e) => handleCloseFile(e, file.id)}
                    className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor or Empty State */}
          <div className={`w-full ${(isInputVisible || isOutputVisible) ? 'h-[calc(100%-300px)]' : 'h-full'} overflow-hidden`}>
            {openFiles.length > 0 && currentFile ? (
              <Editor />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Code2 className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl">Click a file in the sidebar to start editing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* IO Panel container */}
          {(isInputVisible || isOutputVisible) && (
            <div className="w-full h-[300px] flex border-t border-[#1E4976] overflow-hidden">
              {isInputVisible && (
                <div className="flex-1">
                  <IOPanel type="input" />
                </div>
              )}
              {isOutputVisible && (
                <div className="flex-1 border-l border-[#1E4976]">
                  <IOPanel type="output" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;