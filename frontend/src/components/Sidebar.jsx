import React, { useEffect, useState } from 'react';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { Code2 } from 'lucide-react';
import { SiJavascript, SiPython, SiHtml5, SiCss3, SiCplusplus, SiRust, SiGo } from 'react-icons/si';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setCurrentFile, setFileContent } from '../redux/slices/editorSlice';
import Collaborators from './Collaborators';
import JoinRequest from './JoinRequest';
import { AnimatePresence } from 'framer-motion';

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return <SiJavascript className="text-yellow-400" />;
    case 'py':
      return <SiPython className="text-blue-500" />;
    case 'html':
      return <SiHtml5 className="text-orange-500" />;
    case 'css':
      return <SiCss3 className="text-blue-300" />;
    case 'cpp':
    case 'c':
      return <SiCplusplus className="text-blue-600" />;
    case 'rs':
      return <SiRust className="text-orange-600" />;
    case 'go':
      return <SiGo className="text-blue-400" />;
    default:
      return <Code2 className="text-gray-400" />;
  }
};


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

const FileTreeItem = ({ item, expandedFolders, toggleFolder, folderId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isFolder = item.type === 'folder';
  const isExpanded = expandedFolders.includes(item.id);
  
  const handleItemClick = () => {
    if (isFolder) {
      toggleFolder(item.id);
    } else {
      dispatch(setCurrentFile(item));
      dispatch(setFileContent({ fileId: item.id, content: item.content || '' }));
      navigate(`/editor/${folderId}/${item.id}`);
    }
  };
  
  return (
    <div className="mb-1">
      <div 
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-[#132F4C] ${
          !isFolder ? 'pl-6' : ''
        }`}
        onClick={handleItemClick}
      >
        {isFolder && (
          <span className="mr-1 text-gray-400">
            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
          </span>
        )}
        <span className="mr-2 text-lg">
          {isFolder ? (
            isExpanded ? <FaFolderOpen className="text-yellow-400" /> : <FaFolder className="text-yellow-400" />
          ) : (
            getFileIcon(item.name)
          )}
        </span>
        <span className="text-sm text-gray-200 truncate">{item.name}</span>
      </div>
      
      {isFolder && isExpanded && item.items && (
        <div className="ml-4 pl-2 border-l border-gray-700">
          {item.items.map((subItem) => (
            <FileTreeItem
              key={subItem.id}
              item={subItem}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              folderId={folderId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ folderId }) => {
  const { currentFolder } = useSelector((state) => state.fileSystem);
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const location = useLocation();
  const [ws, setWs] = useState(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      console.log('Initializing Sidebar WebSocket for room:', roomParam);
      
      const socket = new WebSocket('ws://localhost:8080');
      
      socket.onopen = () => {
        console.log('Sidebar WebSocket connection established');
        socket.send(JSON.stringify({
          type: 'getUsersList',
          roomId: roomParam
        }));
        
        socket.send(JSON.stringify({
          type: 'join',
          roomId: roomParam,
          userId: localStorage.getItem('userUID') || 'sidebar-' + Math.random().toString(36).substring(2, 9),
          userName: localStorage.getItem('userName') || 'Anonymous'
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Sidebar received message:', data.type);
          
          switch (data.type) {
            case 'usersList':
              console.log('Received users list:', data.users);
              setCollaborators(data.users || []);
              break;
            case 'userJoined':
              console.log(`User joined: ${data.userName}`);
              setCollaborators(prev => {
                if (!prev.includes(data.userName)) {
                  return [...prev, data.userName];
                }
                return prev;
              });
              break;
            case 'userLeft':
              console.log(`User left: ${data.userName}`);
              setCollaborators(prev => prev.filter(user => user !== data.userName));
              break;
            case 'joinRequest':
              console.log(`Join request from: ${data.userName}`);
              setJoinRequests(prev => [
                ...prev, 
                { userId: data.userId, userName: data.userName }
              ]);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('Sidebar WebSocket error:', error);
      };
      
      setWs(socket);
      
      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    }
  }, [location.search]);
  
  const handleAcceptJoinRequest = (userId, userName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'acceptJoinRequest',
        roomId: new URLSearchParams(location.search).get('room'),
        userId,
        userName
      }));
      setJoinRequests(prev => prev.filter(req => req.userId !== userId));
    }
  };
  
  const handleRejectJoinRequest = (userId, userName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'rejectJoinRequest',
        roomId: new URLSearchParams(location.search).get('room'),
        userId,
        userName
      }));
      setJoinRequests(prev => prev.filter(req => req.userId !== userId));
    }
  };
  
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
  };
  
  useEffect(() => {
    if (currentFolder?.items) {
      setExpandedFolders([currentFolder.id]);
    }
  }, [currentFolder]);
  
  if (!currentFolder) {
    return (
      <div className="w-64 h-full bg-[#031d38] border-r border-[#1E4976] flex flex-col">
        <div className="p-4 flex-1">
          <div className="animate-pulse">
            <div className="h-4 bg-[#132F4C] rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-[#132F4C] rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-[#132F4C] rounded w-2/3 mb-3"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-[#031d38] border-r border-[#1E4976] text-white flex flex-col">
      <div className="p-4 flex-1 overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Files</h2>
        {currentFolder?.items?.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            folderId={folderId}
          />
        ))}
      </div>
      
      {/* Join Requests Section - Only show for room owner */}
      {localStorage.getItem('isRoomOwner') === 'true' && joinRequests.length > 0 && (
        <div className="p-4 border-t border-[#1E4976]">
          <h3 className="text-sm font-semibold mb-2 text-blue-300">Join Requests</h3>
          <AnimatePresence>
            {joinRequests.map((request) => (
              <JoinRequest
                key={request.userId}
                userName={request.userName}
                onAccept={() => handleAcceptJoinRequest(request.userId, request.userName)}
                onReject={() => handleRejectJoinRequest(request.userId, request.userName)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Collaborators Section */}
      <Collaborators users={collaborators} />
    </div>
  );
};

export default Sidebar;
