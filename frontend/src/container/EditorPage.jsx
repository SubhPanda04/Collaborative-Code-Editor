import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Code2 } from 'lucide-react'; 
import { setCurrentFile, setFileContent, closeFile } from '../redux/slices/editorSlice';
import { setCurrentFolder } from '../redux/slices/fileSystemSlice';
import { setError } from '../redux/slices/uiSlice';
import { Header, Sidebar, Editor, IOPanel } from '../components';
import '../config/editorConfig'; 
import { FaTimes } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Add the missing findFileInFolder function
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

const EditorPage = () => {
  const { folderId, fileId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Get required state from Redux store
  const { currentFile, openFiles, unsavedChanges } = useSelector((state) => state.editor);
  const { isInputVisible, isOutputVisible } = useSelector((state) => state.ui);
  
  const urlParams = new URLSearchParams(location.search);
  const roomParam = urlParams.get('room');
  
  // Define the copyToClipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Room link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy link');
    }
  };
  
  // Define the copyShareableLink function
  const copyShareableLink = () => {
    // Use current window location instead of ngrok
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    if (!roomParam) {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      localStorage.setItem('isRoomOwner', 'true');
      const currentPath = window.location.pathname;
      const newUrl = `${currentPath}?room=${newRoomId}`;
      
      navigate(newUrl, { replace: true });
      
      setTimeout(() => {
        const shareableUrl = `${protocol}//${host}${newUrl}`;
        copyToClipboard(shareableUrl);
      }, 100);
    } else {
      const shareableUrl = `${protocol}//${host}${window.location.pathname}?room=${roomParam}`;
      copyToClipboard(shareableUrl);
    }
  };
  
  // First useEffect - Handle room parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      setRoomId(roomParam);
      console.log("Joining collaborative room:", roomParam);
      
      const isCreator = roomParam.startsWith(localStorage.getItem('userUID'));
      localStorage.setItem('isRoomOwner', isCreator.toString());
      
      // Use a direct WebSocket URL without any URL constructor
      let ws;
      try {
        // Use WebSocket URL based on current window location
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.host;
        const socketUrl = `${wsProtocol}//${wsHost}/ws`;
        
        console.log(`Connecting to WebSocket at ${socketUrl}`);
        ws = new WebSocket(socketUrl);
        
        ws.onopen = () => {
          console.log("WebSocket connection established successfully");
          const userId = localStorage.getItem('userUID') || 'anonymous-' + Math.random().toString(36).substring(2, 9);
          const userName = localStorage.getItem('userName') || 'Anonymous';
          
          console.log(`Joining room ${roomParam} as ${userName} (${userId})`);
          
          ws.send(JSON.stringify({
            type: 'join',
            roomId: roomParam,
            userId: userId,
            userName: userName
          }));
        };
        
        // Add more detailed error handling
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast.error('Failed to connect to collaboration server');
        };
        
        ws.onclose = () => {
          console.log('WebSocket connection closed');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data.type);
            switch (data.type) {
              case 'userJoined':
                console.log(`User joined: ${data.userName}`);
                break;
              case 'userLeft':
                console.log(`User left: ${data.userName}`);
                break;
              case 'usersList':
                console.log('Current users:', data.users);
                break;
              default:
                break;
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        toast.error('Failed to establish WebSocket connection');
      }
      
      return () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'leave',
            roomId: roomParam,
            userId: localStorage.getItem('userUID') || 'anonymous'
          }));
          ws.close();
        }
      };
    }
  }, [location.search, navigate]);

  // Second useEffect - Fetch folder data
  useEffect(() => {
    const fetchFolderData = async () => {
      if (!folderId) {
        console.log("No folder ID provided, skipping folder fetch");
        setLoading(false);
        return;
      }
      
      console.log("Fetching folder data for ID:", folderId);
      setLoading(true);
      try {
        const folderRef = doc(db, "playgrounds", folderId);
        const folderSnap = await getDoc(folderRef);
        
        if (folderSnap.exists()) {
          console.log("Folder data found:", folderSnap.id);
          const folderData = folderSnap.data();
          const transformedData = {
            ...folderData,
            id: folderId,
            items: folderData.items || []
          };
          
          dispatch(setCurrentFolder(transformedData));
          
          // If fileId is provided, set the current file
          if (fileId) {
            console.log("File ID provided, setting current file:", fileId);
            const fileItem = findFileInFolder(transformedData.items, fileId);
            
            if (fileItem) {
              console.log("File found in folder structure:", fileItem.name);
              dispatch(setCurrentFile(fileItem));
              dispatch(setFileContent({ fileId: fileItem.id, content: fileItem.content || '' }));
            } else {
              console.error("File not found in folder structure");
              setErrorState("File not found in this playground");
            }
          }
        } else {
          console.error("Folder not found");
          setErrorState("Playground not found");
        }
      } catch (error) {
        console.error("Error fetching folder data:", error);
        setErrorState("Error loading playground");
        dispatch(setError("Error loading playground"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchFolderData();
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

  const handleFileTabClick = (file) => {
    dispatch(setCurrentFile(file));
    navigate(`/editor/${folderId}/${file.id}`);
  };

  const handleCloseFile = async (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
  
    const remainingFiles = openFiles.filter(f => f.id !== fileId);
    await dispatch(closeFile(fileId));
    
    if (remainingFiles.length > 0) {
      const nextFile = remainingFiles[remainingFiles.length - 1];
      await dispatch(setCurrentFile(nextFile));
      navigate(`/editor/${folderId}/${nextFile.id}`, { replace: true });
    } else {
      await dispatch(setCurrentFile(null));
      navigate(`/editor/${folderId}`, { replace: true });
    }
  };

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
          {openFiles && openFiles.length > 0 && (
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
                    {file.name} {unsavedChanges && unsavedChanges[file.id] ? '•' : ''}
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
            {openFiles && openFiles.length > 0 && currentFile ? (
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