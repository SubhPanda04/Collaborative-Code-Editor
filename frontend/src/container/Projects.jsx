import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaFolder, FaTrash, FaPencilAlt, FaChevronDown, FaChevronRight, FaJs, FaPython, FaJava, FaHtml5, FaCss3, FaPlus } from 'react-icons/fa';
import { Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import { setPlaygrounds, setLoading, setError, clearPlaygrounds } from '../redux/slices/playgroundSlice';
import { setCurrentFolder } from '../redux/slices/fileSystemSlice';
import { setCurrentFile, setFileContent } from '../redux/slices/editorSlice';
import { SiTypescript, SiCplusplus, SiRust, SiGo } from 'react-icons/si';


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

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'js':
      return <FaJs className="text-yellow-500" />;
    case 'py':
      return <FaPython className="text-blue-500" />;
    case 'java':
      return <FaJava className="text-red-500" />;
    case 'ts':
      return <SiTypescript className="text-blue-400" />;
    case 'html':
      return <FaHtml5 className="text-orange-500" />;
    case 'css':
      return <FaCss3 className="text-blue-300" />;
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

const Projects = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { playgrounds, loading, error } = useSelector((state) => state.playground);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  useEffect(() => {
    let isComponentMounted = true;
    let unsubscribeListener = null;
    
    const fetchPlaygrounds = async () => {
      if (!isComponentMounted) return;
      
      try {
        dispatch(setLoading(true));
      
        const userUID = auth.currentUser?.uid;
        
        if (!userUID) {
          console.log("No user ID found");
          if (isComponentMounted) dispatch(setLoading(false));
          return;
        }
      
        const playgroundsQuery = query(
          collection(db, "playgrounds"),
          where("userId", "==", userUID)
        );
      
        unsubscribeListener = onSnapshot(
          playgroundsQuery,
          (querySnapshot) => {
            if (!isComponentMounted) return;
            
            const processedData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              const cleanObject = {
                id: doc.id,
                name: data.name,
                type: data.type,
                userId: data.userId,
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
                updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
              };
            
              if (Array.isArray(data.items)) {
                cleanObject.items = JSON.parse(JSON.stringify(
                  data.items.map(item => {
                    if (item.createdAt?.toMillis) {
                      item.createdAt = item.createdAt.toMillis();
                    }
                    if (item.updatedAt?.toMillis) {
                      item.updatedAt = item.updatedAt.toMillis();
                    }
                    return item;
                  })
                ));
              } else {
                cleanObject.items = [];
              }
              
              return cleanObject;
            });
            
            if (isComponentMounted) {
              dispatch(setPlaygrounds(processedData));
              dispatch(setLoading(false));
            }
          },
          (error) => {
            console.error("Firestore query error:", error);
            if (isComponentMounted) {
              dispatch(setError(`Failed to load projects: ${error.message}`));
              dispatch(setLoading(false));
            }
          }
        );
      } catch (error) {
        console.error("Error in fetchPlaygrounds:", error);
        if (isComponentMounted) {
          dispatch(setError(`Failed to load projects: ${error.message}`));
          dispatch(setLoading(false));
        }
      }
    };
    
    fetchPlaygrounds();
    
    return () => {
      console.log("Projects component unmounting - cleaning up listeners");
      isComponentMounted = false;
      
      if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
      }
    };
  }, [dispatch]); 

  const handleNestedOperation = async (parentFolderId, nestedParentId, operation, type) => {
    try {
      const folderRef = doc(db, "playgrounds", parentFolderId);
      const folderDoc = await getDoc(folderRef);
      
      if (!folderDoc.exists()) {
        throw new Error("Folder not found");
      }

      const findAndUpdateItems = (items, targetId) => {
        return items.map(item => {
          if (item.id === targetId) {
            if (operation === 'add') {
              const updatedItems = [...(item.items || [])];
              if (type === 'file') {
                const fileName = prompt("Enter file name (without extension:");
                if (!fileName) return item;

                const fileExtension = prompt("Enter file extension (without dot:");
                if (!fileExtension) return item;

                const fullFileName = `${fileName}.${fileExtension}`;

                const newFile = {
                  id: Date.now().toString(),
                  name: fullFileName,
                  type: 'file',
                  content: '',
                  language: fileExtension,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                updatedItems.push(newFile);
              } else if (type === 'folder') {
                const folderName = prompt("Enter folder name:");
                if (!folderName) return item;

                const newFolder = {
                  id: Date.now().toString(),
                  name: folderName,
                  type: 'folder',
                  items: [], 
                  createdAt: new Date().toISOString()
                };

                updatedItems.push(newFolder);
              }
              return { ...item, items: updatedItems };
            }
            return null;
          }

          if (item.type === 'folder' && item.items) {
            const updatedItems = findAndUpdateItems(item.items, targetId);
            return { ...item, items: updatedItems.filter(Boolean) };
          }
          return item;
        });
      };

      const updatedItems = findAndUpdateItems(folderDoc.data().items, nestedParentId).filter(Boolean);

      await updateDoc(folderRef, {
        items: updatedItems
      });
    } catch (error) {
      dispatch(setError(`Operation failed: ${error.message}`));
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      dispatch(clearPlaygrounds());
      navigate('/home/auth');
    } catch (error) {
      dispatch(setError("Failed to sign out. Please try again."));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading Playgrounds...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl text-center p-8">
          <div className="text-red-500 mb-4">⚠️</div>
          <div className="mb-4">{error}</div>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const fileTypes = [
    { ext: 'js', name: 'JavaScript', icon: <FaJs className="text-yellow-500" /> },
    { ext: 'py', name: 'Python', icon: <FaPython className="text-blue-500" /> },
    { ext: 'java', name: 'Java', icon: <FaJava className="text-red-500" /> },
    { ext: 'ts', name: 'TypeScript', icon: <SiTypescript className="text-blue-400" /> },
    { ext: 'html', name: 'HTML', icon: <FaHtml5 className="text-orange-500" /> },
    { ext: 'css', name: 'CSS', icon: <FaCss3 className="text-blue-300" /> },
    { ext: 'cpp', name: 'C++', icon: <SiCplusplus className="text-blue-600" /> },
    { ext: 'rs', name: 'Rust', icon: <SiRust className="text-orange-600" /> },
    { ext: 'go', name: 'Go', icon: <SiGo className="text-blue-400" /> },
  ];

  const handleAddFile = async (parentId) => {
    try {
      const fileName = prompt("Enter file name (without extension):");
      if (!fileName) return;
      const fileExtension = prompt("Enter file extension (js,py,java,ts,html,css,cpp,rs,go,c):");
      if (!fileExtension) return;

      const fullFileName = `${fileName}.${fileExtension}`;

      const newFile = {
        id: Date.now().toString(),
        name: fullFileName,
        type: 'file',
        content: '',
        language: fileExtension,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const folderRef = doc(db, "playgrounds", parentId);
      await updateDoc(folderRef, {
        items: arrayUnion(newFile)
      });
    } catch (error) {
      dispatch(setError(`Failed to add file: ${error.message}`));
    }
  };

  const handleAddNestedFolder = async (parentId) => {
    try {
      const folderName = prompt("Enter folder name:");
      if (!folderName) return;

      const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        type: 'folder',
        items: [],
        createdAt: new Date().toISOString()
      };

      const parentFolder = playgrounds.find(p => p.id === parentId);
      const updatedItems = [...(parentFolder.items || []), newFolder];

      const folderRef = doc(db, "playgrounds", parentId);
      await updateDoc(folderRef, {
        items: updatedItems
      });
    } catch (error) {
      dispatch(setError(`Failed to add nested folder: ${error.message}`));
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      await deleteDoc(doc(db, "playgrounds", id));
    } catch (error) {
      dispatch(setError(`Failed to delete ${type}: ${error.message}`));
    }
  };

  const handleDeleteNestedItem = async (parentId, itemId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this item?')) return;

      const folderRef = doc(db, "playgrounds", parentId);
      const folderDoc = await getDoc(folderRef);

      if (!folderDoc.exists()) {
        throw new Error("Parent folder not found");
      }

      const removeItem = (items) => {
        return items.map(item => {
          if (item.id === itemId) {
            return null;
          }
          if (item.type === 'folder' && item.items) {
            const updatedItems = removeItem(item.items).filter(Boolean);
            return { ...item, items: updatedItems };
          }
          return item;
        }).filter(Boolean); 
      };

      const updatedItems = removeItem(folderDoc.data().items);

      await updateDoc(folderRef, {
        items: updatedItems
      });
    } catch (error) {
      dispatch(setError(`Failed to delete item: ${error.message}`));
    }
  };

  const handleFileClick = (e, folderId, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!folderId || !fileId) {
      console.error("Missing folderId or fileId");
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      dispatch(setError("You must be logged in to access the editor"));
      navigate('/home/auth');
      return;
    }
  
    const folder = playgrounds.find(p => p.id === folderId);
    const file = findFileInFolder(folder.items, fileId);
    
    if (file) {
      dispatch(setCurrentFolder(folder));
      dispatch(setCurrentFile(file));
      dispatch(setFileContent({ 
        fileId: file.id, 
        content: file.content || '' 
      }));
      
      navigate(`/editor/${folderId}/${fileId}`, { 
        replace: true, 
        state: { noRefresh: true } 
      });
    }
  };

  const renderNestedItems = (items, parentId, level = 0) => {
    return items?.map((item) => (
      <div key={item.id} className="bg-gray-700/50 rounded-lg mb-2 overflow-hidden">
        {item.type === 'file' ? (
          <div 
            onClick={(e) => handleFileClick(e, parentId, item.id)}
            className="flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-gray-600"
          >
            <div className="flex-1 flex items-center gap-2">
              {getFileIcon(item.name)}
              <span className="text-gray-200">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNestedItem(parentId, item.id);
                }}
                className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <FaTrash size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 py-3 px-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(item.id);
                }}
                className="bg-gray-600 p-1 rounded"
              >
                {expandedFolders.has(item.id) ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              <div className="flex-1 flex items-center gap-2">
                <FaFolder className="text-blue-500" />
                <span className="text-gray-200">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNestedOperation(parentId, item.id, 'add', 'file');
                  }}
                  className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-blue-500"
                  title="Add File"
                >
                  <FaPlus size={12} />
                  <Code2 size={12} className="inline ml-1" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNestedOperation(parentId, item.id, 'add', 'folder');
                  }}
                  className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-blue-500"
                  title="Add Folder"
                >
                  <FaPlus size={12} />
                  <FaFolder size={12} className="inline ml-1" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNestedItem(parentId, item.id);
                  }}
                  className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
            {expandedFolders.has(item.id) && item.items && (
              <div className="px-4 pb-3">
                {renderNestedItems(item.items, parentId, level + 1)}
              </div>
            )}
          </>
        )}
      </div>
    ));
  };

  const handleAddFolder = async () => {
    try {
      const folderName = prompt("Enter folder name:");
      if (!folderName) return;

      const userUID = auth.currentUser?.uid;
      if (!userUID) {
        dispatch(setError("You must be logged in to create folders"));
        return;
      }

      const newFolder = {
        name: folderName,
        type: 'folder',
        items: [],
        userId: userUID,  
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "playgrounds"), newFolder);
    } catch (error) {
      dispatch(setError(`Failed to create folder: ${error.message}`));
    }
  };

  const findNestedFolder = (items, folderId) => {
    for (const item of items) {
      if (item.id === folderId) {
        return item;
      }
      if (item.type === 'folder' && item.items) {
        const found = findNestedFolder(item.items, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  const renderPlaygroundItems = (playground) => {
    if (!playground.items) return null;
    return (
      <div className="space-y-2">
        {renderNestedItems(playground.items, playground.id)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white overflow-y-auto">
      <div className="max-w-[1800px] mx-auto p-8">
        <div className="w-full flex items-center justify-between gap-4 mb-8 sticky top-0 bg-[#1e1e1e] z-10 py-4">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleAddFolder}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-3 transition-colors text-lg"
            >
              <FaPlus size={16} />
              <FaFolder size={18} />
              New Folder
            </button>
            <div className="h-14 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-semibold">
                Welcome, {localStorage.getItem('userName') || 'User'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-lg"
          >
            Sign Out
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {playgrounds.map((playground) => (
            <div key={playground.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
              <div className="p-3.5 bg-gray-750 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFolder className="text-blue-500 text-2xl" />
                    <h3 className="text-xl font-semibold">{playground.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAddFile(playground.id)}
                      className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                      title="Add File"
                    >
                      <FaPlus size={14} />
                      <Code2 size={14} className="inline ml-1" />
                    </button>
                    <button
                      onClick={() => handleAddNestedFolder(playground.id)}
                      className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                      title="Add Nested Folder"
                    >
                      <FaPlus size={14} />
                      <FaFolder size={14} className="inline ml-1" />
                    </button>
                    <button
                      onClick={() => handleDelete(playground.id, 'folder')}
                      className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Folder"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 h-[400px] overflow-y-auto custom-scrollbar">
                {playground.items?.length > 0 ? (
                  renderPlaygroundItems(playground)
                ) : (
                  <div className="text-gray-400 text-center py-4">No items in this folder</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {playgrounds.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-xl p-8">
            <FaFolder className="text-blue-500 text-5xl mx-auto mb-6" />
            <p className="text-2xl">No folders yet. Create a new folder to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
