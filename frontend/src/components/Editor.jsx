import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { setFileContent, clearUnsavedChanges } from '../redux/slices/editorSlice';
import { editorOptions } from '../config/editorConfig';
import { debounce } from 'lodash';
import { Code2, Share2, Copy, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { toast } from 'react-hot-toast';
import AIAssistant from './AIAssistant';

const getLanguageFromFileName = (fileName) => {
  if (!fileName) return 'plaintext';
  const extension = fileName.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'cpp': 'cpp',
    'c': 'c',
    'rs': 'rust',
    'go': 'go',
  };
  return languageMap[extension] || 'plaintext';
};

const contentCache = new Map();
const Editor = () => {
  const { folderId, fileId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [joinStatus, setJoinStatus] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Get the room parameter from the URL
  const urlParams = new URLSearchParams(location.search);
  const roomParam = urlParams.get('room');
  
  const { currentFile, activeFiles, selectedTheme, isAIEnabled } = useSelector((state) => state.editor);
  const { currentFolder } = useSelector((state) => state.fileSystem);
  
  const currentContent = useMemo(() => {
    if (!currentFile) return '';
    return activeFiles[currentFile.id] || '';
  }, [currentFile, activeFiles]);
  
  const editorLanguage = useMemo(() => {
    if (!currentFile) return 'plaintext';
    return getLanguageFromFileName(currentFile.name);
  }, [currentFile?.name]);

  // Improved copyShareableLink function that uses window location
  const copyShareableLink = () => {
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast.success('Room link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy link');
      });
  };
  
  const debouncedUpdate = useCallback(
    debounce(async (fileId, content) => {
      if (!currentFolder || !fileId) return;
      if (contentCache.get(fileId) === content) {
        console.log('Content unchanged, skipping Firestore update');
        dispatch(clearUnsavedChanges(fileId));
        return;
      }
      
      try {
        const folderRef = doc(db, "playgrounds", currentFolder.id);
        const updateNestedFileContent = (items) => {
          return items.map(item => {
            if (item.id === fileId) {
              return { ...item, content };
            }
            if (item.type === 'folder' && item.items) {
              return { ...item, items: updateNestedFileContent(item.items) };
            }
            return item;
          });
        };
  
        await updateDoc(folderRef, {
          items: updateNestedFileContent(currentFolder.items)
        });
        contentCache.set(fileId, content);
        dispatch(clearUnsavedChanges(fileId));
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }, 1000),
    [currentFolder]
  );

  // Enhanced WebSocket useEffect - KEEP THIS ONE
  useEffect(() => {
    if (!roomParam || !currentFile?.id) {
      console.log('Missing room param or file ID:', { roomParam, fileId: currentFile?.id });
      return;
    }

    const connectWebSocket = () => {
      // Use WebSocket URL based on current window location
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const socketUrl = `${wsProtocol}//${wsHost}/ws`;
      
      console.log('Attempting WebSocket connection to:', socketUrl);
      
      try {
        const socket = new WebSocket(socketUrl);
        
        socket.onopen = () => {
          console.log('WebSocket connected, setting up editor...');
          setWs(socket);
          setJoinStatus('connected');
          
          // Initialize editor if not already done
          if (editorRef.current && currentFile && currentContent) {
            editorRef.current.setValue(currentContent);
          }
          
          const userId = localStorage.getItem('userUID') || 'anonymous-' + Math.random().toString(36).substring(2, 9);
          const userName = localStorage.getItem('userName') || 'Anonymous';
          
          socket.send(JSON.stringify({
            type: 'join',
            roomId: roomParam,
            userId,
            userName,
            fileId: currentFile.id,
            content: currentContent // Send initial content
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type !== 'code') {
              console.log('Received message:', data.type);
            }
            
            switch (data.type) {
              case 'joinRequestAccepted':
                setJoinStatus('accepted');
                break;
                
              case 'joinRequestRejected':
                setJoinStatus('rejected');
                if (data.userId === localStorage.getItem('userUID')) {
                  toast.error('Your request to join the room was rejected.');
                  navigate('/home/projects');
                }
                break;
                
              case 'joinRequestPending':
                setJoinStatus('pending');
                break;
                
              case 'code':
                const myUserId = localStorage.getItem('userUID');
                if (data.fileId === currentFile?.id && data.userId !== myUserId) {
                  dispatch(setFileContent({
                    fileId: data.fileId,
                    content: data.code
                  }));
                  
                  contentCache.set(data.fileId, data.code);
                  
                  if (editorRef.current) {
                    const currentModel = editorRef.current.getModel();
                    if (currentModel) {
                      const selections = editorRef.current.getSelections();
                      currentModel.setValue(data.code);
                      if (selections) {
                        editorRef.current.setSelections(selections);
                      }
                    }
                  }
                }
                break;
                
              default:
                console.log('Unhandled message type:', data.type);
                break;
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setJoinStatus('error');
          toast.error('Connection error. Retrying...');
          setTimeout(connectWebSocket, 2000); // Auto-retry after 2 seconds
        };

        socket.onclose = () => {
          console.log('WebSocket closed');
          setJoinStatus('disconnected');
          setTimeout(connectWebSocket, 2000); // Auto-reconnect after 2 seconds
        };

        return () => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };
      } catch (error) {
        console.error('WebSocket setup error:', error);
        toast.error('Failed to connect. Retrying...');
        setTimeout(connectWebSocket, 2000); // Auto-retry after 2 seconds
      }
    };

    connectWebSocket();
  }, [roomParam, currentFile?.id, currentContent, navigate]);

  // Modified editor mount handler
  const handleEditorDidMount = (editor, monaco) => {
    console.log("Editor mounting with content:", currentContent);
    editorRef.current = editor;
    monacoRef.current = monaco;

    try {
      monaco.editor.setTheme(selectedTheme === 'light' ? 'vs' : 'vs-dark');
      
      // Set initial content
      if (currentContent) {
        editor.setValue(currentContent);
      }

      // Setup change handler
      editor.onDidChangeModelContent(() => {
        if (!currentFile) return;
        
        const newContent = editor.getValue();
        dispatch(setFileContent({ fileId: currentFile.id, content: newContent }));
        
        if (ws && ws.readyState === WebSocket.OPEN && roomParam) {
          ws.send(JSON.stringify({
            type: 'code',
            roomId: roomParam,
            fileId: currentFile.id,
            code: newContent,
            userId: localStorage.getItem('userUID') || 'anonymous'
          }));
        }
        
        debouncedUpdate(currentFile.id, newContent);
      });
      
      setEditorReady(true);
      setIsLoading(false);
      
      console.log("Editor mounted successfully");
    } catch (error) {
      console.error('Editor mount error:', error);
      setEditorReady(true);
      setIsLoading(false);
    }
  };

  // Update WebSocket message handler
  useEffect(() => {
    if (!roomParam || !currentFile?.id) return;

    const connectWebSocket = () => {
      const wsNgrokDomain = localStorage.getItem('wsNgrokUrl') || 'ebf5-103-92-44-199.ngrok-free.app';
      const socketUrl = `wss://${wsNgrokDomain.trim()}/ws`;
      
      try {
        const socket = new WebSocket(socketUrl);
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'code' && data.fileId === currentFile.id && data.userId !== localStorage.getItem('userUID')) {
              // Update editor content without triggering the change event
              if (editorRef.current) {
                const position = editorRef.current.getPosition();
                editorRef.current.setValue(data.code);
                editorRef.current.setPosition(position);
              }
              
              dispatch(setFileContent({ fileId: data.fileId, content: data.code }));
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        // ... rest of WebSocket setup ...
      } catch (error) {
        console.error('WebSocket setup error:', error);
      }
    };

    connectWebSocket();
  }, [roomParam, currentFile?.id]);

  // Diagnostic logging
  useEffect(() => {
    console.log("Editor component state:", {
      currentFile: currentFile?.name,
      roomParam,
      editorReady,
      joinStatus
    });
    
    return () => {
      console.log("Editor component unmounting");
    };
  }, [currentFile, roomParam, editorReady, joinStatus]);

  // Add the missing handleEditorChange function
  const handleEditorChange = (value) => {
    if (!currentFile) return;
    
    // The content change is already handled in the editor's onDidChangeModelContent event
    // This function is just to satisfy the onChange prop requirement
    // The actual content updates are managed in handleEditorDidMount
  };

  if (!currentFile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
        <div className="text-center space-y-4">
          <Code2 size={48} className="mx-auto text-gray-400" />
          <p className="text-lg">Select a file to start editing</p>
          <p className="text-sm opacity-60">Your code will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Room ID indicator */}
      {roomParam && (
        <div className="absolute top-2 left-2 z-10 bg-gray-800 text-gray-300 px-3 py-1.5 rounded-md text-sm">
          <span>Room: {roomParam}</span>
        </div>
      )}
      
      <div className="h-full">
        <MonacoEditor
          height="100%"
          defaultLanguage={editorLanguage}
          language={editorLanguage}
          value={currentContent}
          theme={selectedTheme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400">Loading editor...</p>
              </div>
            </div>
          }
          options={{
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 20, // Increased from 14
            fontFamily: "'Consolas', 'Courier New', monospace",
            lineNumbers: 'on',
            lineHeight: 29, // Added line height
            letterSpacing: 0.5, // Added letter spacing
            renderWhitespace: 'none',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            formatOnPaste: true,
            formatOnType: false, // Prevents auto-formatting while typing
            renderControlCharacters: false,
            renderIndentGuides: true,
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
          key={currentFile?.id} // Removed room param and content from key to prevent re-renders
        />
      </div>
      {isAIEnabled && <AIAssistant/>}
    </div>
  );
};

export default Editor;

