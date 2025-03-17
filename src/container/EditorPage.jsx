import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { 
  setCurrentFile, 
  setFileContent,
} from '../redux/slices/editorSlice';
import { setCurrentFolder } from '../redux/slices/fileSystemSlice';
import { setError } from '../redux/slices/uiSlice';
import { Header, Sidebar, Editor, IOPanel } from '../components';

const EditorPage = () => {
  const { folderId, fileId } = useParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const { isInputVisible, isOutputVisible } = useSelector((state) => state.ui);

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
  }, [folderId, fileId, dispatch]);

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

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#1e1e1e]">
      <Header />
      <div className="w-full h-[calc(100vh-48px)] flex">
        <div className="w-80 flex-shrink-0">
          <Sidebar folderId={folderId} />
        </div>
        <div className="flex-1 flex flex-col relative">
          {/* Editor container with adjusted height */}
          <div className={`w-full ${(isInputVisible || isOutputVisible) ? 'h-[calc(100%-200px)]' : 'h-full'}`}>
            <Editor />
          </div>
          
          {/* IO Panel container */}
          {(isInputVisible || isOutputVisible) && (
            <div className="w-full h-[200px] flex border-t border-[#1E4976]">
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
