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
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const dispatch = useDispatch();
  const { currentFile, activeFiles, selectedTheme } = useSelector((state) => state.editor);
  const { currentFolder } = useSelector((state) => state.fileSystem);
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [ws, setWs] = useState(null);
  const [joinStatus, setJoinStatus] = useState('idle');
  const [copied, setCopied] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  
  const urlParams = new URLSearchParams(location.search);
  const roomParam = urlParams.get('room');
  
  const currentContent = useMemo(() => {
    if (!currentFile) return '';
    return activeFiles[currentFile.id] || '';
  }, [currentFile, activeFiles]);
  
  const editorLanguage = useMemo(() => {
    if (!currentFile) return 'plaintext';
    return getLanguageFromFileName(currentFile.name);
  }, [currentFile?.name]);

  const copyShareableLink = () => {
    if (!roomParam) {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      localStorage.setItem('isRoomOwner', 'true');
      const currentPath = window.location.pathname;
      const newUrl = `${currentPath}?room=${newRoomId}`;
      
      navigate(newUrl, { replace: true });
      
      setTimeout(() => {
        copyToClipboard(`${window.location.origin}${newUrl}`);
      }, 100);
    } else {
      copyToClipboard(`${window.location.origin}${window.location.pathname}?room=${roomParam}`);
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

  const handleEditorDidMount = (editor, monaco) => {
    console.time('Editor mount');
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    try {
      editor.getModel().updateOptions({ 
        tabSize: 2,
        insertSpaces: true,
        trimAutoWhitespace: true,
        detectIndentation: false
      });
      
      monaco.editor.defineTheme('fixedCursorTheme', {
        base: selectedTheme === 'light' ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [],
        colors: {}
      });
      
      monaco.editor.setTheme('fixedCursorTheme');
      
      editor.updateOptions({
        cursorStyle: 'line',
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        formatOnPaste: false,
        formatOnType: false,
        fontFamily: "'Consolas', 'Courier New', monospace",
        disableMonospaceOptimizations: true,
        fontLigatures: false,
        textDirection: 'ltr',
        // Performance optimizations
        renderWhitespace: 'none',
        renderControlCharacters: false,
        renderIndentGuides: false,
        renderLineHighlight: 'line',
        renderValidationDecorations: 'editable',
        scrollBeyondLastLine: false
      });
      
      if (currentFile) {
        contentCache.set(currentFile.id, currentContent);
      }
      
      setEditorReady(true);
      console.timeEnd('Editor mount');
    } catch (error) {
      console.error('Error configuring editor:', error);
      setEditorReady(true);
    }
  };

  useEffect(() => {
    if (roomParam) {
      console.log('Initializing WebSocket connection for room:', roomParam);
      
      const socket = new WebSocket('ws://localhost:8080');
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        
        const isRoomOwner = localStorage.getItem('isRoomOwner') === 'true';
        const userId = localStorage.getItem('userUID') || 'anonymous-' + Math.random().toString(36).substring(2, 9);
        const userName = localStorage.getItem('userName') || 'Anonymous';
        
        if (isRoomOwner) {
          setJoinStatus('owner');
          socket.send(JSON.stringify({
            type: 'joinAsOwner',
            roomId: roomParam,
            userId: userId,
            userName: userName
          }));
        } else {
          setJoinStatus('pending');
          socket.send(JSON.stringify({
            type: 'requestJoin',
            roomId: roomParam,
            userId: userId,
            userName: userName
          }));
        }
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
                alert('Your request to join the room was rejected.');
                window.location.href = '/home/projects';
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
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setWs(socket);
      
      return () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'leave',
            roomId: roomParam,
            userId: localStorage.getItem('userUID') || 'anonymous'
          }));
          socket.close();
        }
      };
    }
  }, [roomParam, dispatch, currentFile]);

  const handleEditorChange = (value) => {
    if (!currentFile || !currentFolder) return;
    dispatch(setFileContent({ 
      fileId: currentFile.id, 
      content: value 
    }));
    debouncedUpdate(currentFile.id, value);
    
    const urlParams = new URLSearchParams(location.search);
    const roomParam = urlParams.get('room');
    
    if (ws && ws.readyState === WebSocket.OPEN && roomParam && 
        (joinStatus === 'accepted' || joinStatus === 'owner')) {
      ws.send(JSON.stringify({
        type: 'code',
        roomId: roomParam,
        fileId: currentFile.id,
        code: value,
        userId: localStorage.getItem('userUID') || 'anonymous'
      }));
    }
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
          fontSize: 21,
          fontFamily: "'Consolas', 'Courier New', monospace",
          lineNumbers: 'on',
          minimap: { enabled: false }, 
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          cursorStyle: 'line',
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: false,
          formatOnType: false,
          textDirection: 'ltr',
          fontLigatures: false,
          disableMonospaceOptimizations: true,
          renderWhitespace: 'none',
          renderControlCharacters: false,
          renderIndentGuides: false,
          folding: true,
          glyphMargin: false
        }}
        key={currentFile.id}
      />
    </div>
  );
};

export default Editor;
