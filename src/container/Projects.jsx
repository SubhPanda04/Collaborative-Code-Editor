import React, { useState, useEffect } from 'react'
import { FaFolder, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, deleteDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { motion } from 'framer-motion';

const foldersCollection = collection(db, "folders");
const filesCollection = collection(db, "files");

const Projects = () => {
  const navigate = useNavigate();
  const languages = ['javascript', 'python', 'cpp', 'java', 'typescript', 'html', 'css'];
  
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

  const [playgrounds, setPlaygrounds] = useState([]);

  const cleanupAllFiles = async () => {
    try {
      console.log('Starting cleanup of all files...');
      const filesSnapshot = await getDocs(collection(db, "files"));
      
      // Delete all files
      const deletePromises = filesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log('All files deleted successfully');
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPlaygrounds = async () => {
      if (!isMounted) return;
      
      try {
        const foldersSnapshot = await getDocs(collection(db, "folders"));
        const allFolders = foldersSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          items: []
        }));

        const filesSnapshot = await getDocs(collection(db, "files"));
        const allFiles = filesSnapshot.docs.map(doc => ({
          ...doc.data(),
          icon: <Code2 className={`w-12 h-12 ${getLanguageColor(doc.data().language)}`} />
        }));

        // Create sections map
        const sectionsMap = new Map();
        
        // First, create all sections
        allFolders.forEach(folder => {
          if (!folder.parentFolderId || folder.parentFolderId === folder.sectionId) {
            sectionsMap.set(folder.id.toString(), {
              ...folder,
              items: []
            });
          }
        });

        // Then, add nested folders to their parents
        allFolders.forEach(folder => {
          if (folder.parentFolderId && folder.parentFolderId !== folder.sectionId) {
            const parentFolder = sectionsMap.get(folder.parentFolderId.toString());
            if (parentFolder) {
              parentFolder.items.push({
                ...folder,
                items: []
              });
            }
          }
        });

        // Finally, add files to their respective folders
        allFiles.forEach(file => {
          const folder = sectionsMap.get(file.folderId?.toString());
          if (folder) {
            folder.items.push(file);
          }
        });

        const rootFolders = Array.from(sectionsMap.values());

        console.log('Loaded hierarchy:', {
          allFolders,
          rootFolders,
          sectionsMap,
          allFiles
        });

        if (isMounted) {
          setPlaygrounds(rootFolders);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading playgrounds:", error);
      }
    };

    loadPlaygrounds();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteFolder = async (folderId) => {
    try {
      console.log('Starting deletion process for folder:', folderId);
      
      // Convert folderId to string since that's how we stored it
      const folderIdString = folderId.toString();
      
      // Delete the folder document
      await deleteDoc(doc(db, "folders", folderIdString));
      console.log('Folder document deleted');
      
      // Get and delete all files in this folder
      const filesQuery = query(
        filesCollection,
        where("folderId", "==", folderIdString)
      );
      const filesSnapshot = await getDocs(filesQuery);
      console.log(`Found ${filesSnapshot.docs.length} files to delete`);
      
      // Delete all files
      for (const fileDoc of filesSnapshot.docs) {
        await deleteDoc(doc(filesCollection, fileDoc.id));
        console.log('Deleted file:', fileDoc.id);
      }

      // Update local state immediately after successful deletion
      setPlaygrounds(prevPlaygrounds => {
        const updatedPlaygrounds = prevPlaygrounds.filter(
          folder => folder.id !== folderId
        );
        console.log('Updated playgrounds:', updatedPlaygrounds);
        return updatedPlaygrounds;
      });
      
      // Force a re-render by reloading the playgrounds
      const foldersSnapshot = await getDocs(collection(db, "folders"));
      const foldersData = [];
      
      for (const folderDoc of foldersSnapshot.docs) {
        const folderData = folderDoc.data();
        // Skip if this is a folder we just deleted
        if (folderData.id === folderId) continue;
        
        const filesQuery = query(
          collection(db, "files"), 
          where("folderId", "==", folderData.id)
        );
        const filesSnapshot = await getDocs(filesQuery);
        
        const items = filesSnapshot.docs.map(fileDoc => {
          const fileData = fileDoc.data();
          return {
            ...fileData,
            icon: <Code2 className={`w-12 h-12 ${getLanguageColor(fileData.language)}`} />
          };
        });

        foldersData.push({
          ...folderData,
          items
        });
      }
      
      // Set the playgrounds with fresh data from Firebase
      setPlaygrounds(foldersData);
      
      console.log('Deletion process completed successfully');
    } catch (error) {
      console.error("Error deleting folder:", {
        folderId,
        errorMessage: error.message,
        errorCode: error.code,
        fullError: error
      });
      alert(`Failed to delete folder: ${error.message}`);
    }
  };

  const handleDeleteFile = async (e, sectionId, fileId) => {
    e.stopPropagation();
    
    try {
      // Find the file in the current state to get its document ID
      let documentId = null;
      playgrounds.forEach(section => {
        section.items.forEach(item => {
          if (item.id.toString() === fileId.toString()) {
            documentId = item.documentId;
          }
        });
      });

      if (documentId) {
        // Delete the specific document
        await deleteDoc(doc(db, "files", documentId));
      } else {
        console.error("File document ID not found");
        return;
      }
      
      // Update local state
      setPlaygrounds(prevPlaygrounds => 
        prevPlaygrounds.map(section => {
          if (section.id.toString() === sectionId.toString()) {
            return {
              ...section,
              items: section.items.filter(item => 
                item.id.toString() !== fileId.toString()
              )
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(`Failed to delete file: ${error.message}`);
    }
  };

  const handleEditFolder = (folderId) => {
    const newTitle = prompt('Enter new folder name:');
    if (newTitle) {
      setPlaygrounds(playgrounds.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, title: newTitle };
        }
        return folder;
      }));
    }
  };

  const handleEditFile = (e, folderId, fileId) => {
    e.stopPropagation();
    const currentFile = playgrounds
      .find(folder => folder.id === folderId)
      ?.items.find(item => item.id === fileId);
    
    if (!currentFile) return;

    const newName = prompt('Enter new file name:', currentFile.name);
    if (!newName) return;

    const newLanguage = prompt(
      `Choose language (${languages.join(', ')}):`,
      currentFile.language
    );
    if (!newLanguage || !languages.includes(newLanguage.toLowerCase())) return;

    setPlaygrounds(playgrounds.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          items: folder.items.map(item => {
            if (item.id === fileId) {
              return {
                ...item,
                name: newName,
                language: newLanguage.toLowerCase(),
                icon: <Code2 className={`w-12 h-12 ${getLanguageColor(newLanguage.toLowerCase())}`} />
              };
            }
            return item;
          })
        };
      }
      return folder;
    }));
  };

  const handleAddFolder = async () => {
    const title = prompt('Enter folder name:');
    if (title) {
      const timestamp = new Date().toISOString();
      const newFolder = {
        id: Date.now(),
        title,
        name: title,
        items: [],
        isFolder: true,
        parentFolderId: null,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      try {
        console.log('Creating new folder:', newFolder);
        // Save to Firebase
        await setDoc(doc(db, "folders", newFolder.id.toString()), newFolder);
        // Update local state
        setPlaygrounds(prev => [...prev, newFolder]);
        console.log('Folder created successfully');
      } catch (error) {
        console.error("Error creating folder:", error);
      }
    }
  };

  const handleFileClick = async (folderId, fileId) => {
    const folder = playgrounds.find(f => f.id === folderId);
    const file = folder?.items.find(i => i.id === fileId);
    
    if (file) {
      // Include all files from the folder in the folder structure
      const relevantFolderStructure = [{
        id: folder.id,
        title: folder.title || folder.name, // Add fallback for name
        items: folder.items.map(item => ({
          id: item.id,
          name: item.name,
          language: item.language,
          folderId: folder.id,
          content: item.content || ''
        }))
      }];

      const fileData = {
        id: file.id,
        name: file.name,
        language: file.language,
        content: file.content || '',
        folderId: folder.id,
        folderName: folder.title || folder.name, // Add fallback for name
        folderStructure: relevantFolderStructure,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const fileRef = doc(db, "files", `${folderId}_${fileId}`);
        await setDoc(fileRef, fileData);
        navigate(`/editor/${folderId}/${fileId}`);
      } catch (error) {
        console.error("Error saving file:", error);
      }
    }
  };

  const handleAddFile = async (sectionId, folderId = null) => {
    const name = prompt('Enter file name:');
    if (!name) return;

    const language = prompt(`Choose language (${languages.join(', ')}):`, 'javascript');
    if (!language || !languages.includes(language.toLowerCase())) return;

    const fileId = Date.now().toString();
    const targetFolderId = (folderId || sectionId).toString();
    
    // Create a unique document ID that includes both folder and file IDs
    const documentId = `${targetFolderId}_${fileId}`;
    
    const newFile = {
      id: fileId,
      documentId: documentId, // Store the document ID for easier deletion
      name,
      language: language.toLowerCase(),
      content: '',
      folderId: targetFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to Firebase using the unique document ID
      await setDoc(doc(db, "files", documentId), newFile);
      
      const fileWithIcon = {
        ...newFile,
        icon: <Code2 className={`w-12 h-12 ${getLanguageColor(language.toLowerCase())}`} />
      };
      
      setPlaygrounds(prev => 
        prev.map(section => {
          if (section.id.toString() === sectionId.toString()) {
            if (folderId) {
              return {
                ...section,
                items: section.items.map(item => {
                  if (item.id.toString() === folderId.toString()) {
                    return {
                      ...item,
                      items: [...(item.items || []), fileWithIcon]
                    };
                  }
                  return item;
                })
              };
            }
            return {
              ...section,
              items: [...section.items, fileWithIcon]
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error("Error creating file:", error);
      alert(`Failed to create file: ${error.message}`);
    }
  };

  const handleAddNestedFolder = async (sectionId, parentFolderId = null) => {
    const title = prompt('Enter folder name:');
    if (!title) return;

    const newFolderId = Date.now().toString();
    
    // Find the section in current state
    const section = playgrounds.find(s => s.id.toString() === sectionId.toString());
    if (!section) return;

    const newFolder = {
      id: newFolderId,
      title: title,
      name: title,
      isFolder: true,
      sectionId: sectionId.toString(),
      parentFolderId: parentFolderId ? parentFolderId.toString() : sectionId.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "folders", newFolderId), newFolder);
      console.log('Folder saved to Firebase:', newFolder);

      // Update local state
      setPlaygrounds(prevPlaygrounds => 
        prevPlaygrounds.map(section => {
          if (section.id.toString() === sectionId.toString()) {
            if (!parentFolderId) {
              return {
                ...section,
                items: [...section.items, { ...newFolder, items: [] }]
              };
            }
            return {
              ...section,
              items: section.items.map(item => {
                if (item.id.toString() === parentFolderId.toString()) {
                  return {
                    ...item,
                    items: [...(item.items || []), { ...newFolder, items: [] }]
                  };
                }
                return item;
              })
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error("Error creating nested folder:", error);
      alert(`Failed to create folder: ${error.message}`);
    }
  };

  const handleDeleteNestedFile = async (e, sectionId, parentFolderId, fileId) => {
    e.stopPropagation();
    
    try {
      // Find the file in the current state to get its document ID
      let documentId = null;
      playgrounds.forEach(section => {
        section.items.forEach(item => {
          if (item.id.toString() === parentFolderId.toString()) {
            item.items?.forEach(nestedItem => {
              if (nestedItem.id.toString() === fileId.toString()) {
                documentId = nestedItem.documentId;
              }
            });
          }
        });
      });

      if (documentId) {
        // Delete the specific document
        await deleteDoc(doc(db, "files", documentId));
      } else {
        console.error("Nested file document ID not found");
        return;
      }
      
      // Update local state
      setPlaygrounds(prevPlaygrounds => 
        prevPlaygrounds.map(section => {
          if (section.id.toString() === sectionId.toString()) {
            return {
              ...section,
              items: section.items.map(item => {
                if (item.id.toString() === parentFolderId.toString() && item.isFolder) {
                  return {
                    ...item,
                    items: item.items.filter(nestedItem => 
                      nestedItem.id.toString() !== fileId.toString()
                    )
                  };
                }
                return item;
              })
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error("Error deleting nested file:", error);
      alert(`Failed to delete file: ${error.message}`);
    }
  };

  const handleEditNestedFolder = (sectionId, folderId) => {
    const newTitle = prompt('Enter new folder name:');
    if (!newTitle) return;

    setPlaygrounds(playgrounds.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === folderId && item.isFolder) {
              return {
                ...item,
                name: newTitle
              };
            }
            if (item.isFolder && item.items) {
              return {
                ...item,
                items: item.items.map(nestedItem => {
                  if (nestedItem.id === folderId) {
                    return {
                      ...nestedItem,
                      name: newTitle
                    };
                  }
                  return nestedItem;
                })
              };
            }
            return item;
          })
        };
      }
      return section;
    }));
  };

  const handleDeleteNestedFolder = async (sectionId, nestedFolderId) => {
    try {
      // Delete the nested folder document
      await deleteDoc(doc(db, "folders", nestedFolderId.toString()));
      
      // Get and delete all files in this nested folder
      const filesQuery = query(
        collection(db, "files"),
        where("folderId", "==", nestedFolderId)
      );
      const filesSnapshot = await getDocs(filesQuery);
      await Promise.all(filesSnapshot.docs.map(doc => deleteDoc(doc.ref)));

      // Get and delete all sub-nested folders
      const subNestedQuery = query(
        collection(db, "folders"),
        where("parentFolderId", "==", nestedFolderId)
      );
      const subNestedSnapshot = await getDocs(subNestedQuery);
      
      // Delete all sub-nested folders and their files
      const subNestedDeletePromises = subNestedSnapshot.docs.map(async (folderDoc) => {
        const subFolderId = folderDoc.id;
        const subFilesQuery = query(
          collection(db, "files"),
          where("folderId", "==", subFolderId)
        );
        const subFilesSnapshot = await getDocs(subFilesQuery);
        await Promise.all(subFilesSnapshot.docs.map(doc => deleteDoc(doc.ref)));
        await deleteDoc(folderDoc.ref);
      });
      
      await Promise.all(subNestedDeletePromises);

      // Update local state
      setPlaygrounds(prevPlaygrounds => 
        prevPlaygrounds.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              items: section.items.filter(item => 
                !(item.isFolder && item.id === nestedFolderId)
              )
            };
          }
          return section;
        })
      );
    } catch (error) {
      console.error("Error deleting nested folder:", error);
    }
  };

  const cleanupAllFolders = async () => {
    try {
      console.log('Starting cleanup of all folders...');
      const foldersSnapshot = await getDocs(collection(db, "folders"));
      
      // Delete all folders
      for (const folderDoc of foldersSnapshot.docs) {
        await deleteDoc(doc(db, "folders", folderDoc.id));
        console.log('Deleted folder:', folderDoc.id);
      }
      
      // Delete all files
      const filesSnapshot = await getDocs(collection(db, "files"));
      for (const fileDoc of filesSnapshot.docs) {
        await deleteDoc(doc(db, "files", fileDoc.id));
        console.log('Deleted file:', fileDoc.id);
      }
      
      // Clear local state
      setPlaygrounds([]);
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const renderNestedContent = (section, item) => {
    if (item.isFolder) {
      return (
        <div className="bg-gray-750 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaFolder className="text-yellow-400 w-4 h-4" />
                <span className="text-white text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFile(section.id, item.id);
                  }}
                  className="px-2 py-1 bg-blue-500 text-xs text-white rounded hover:bg-blue-600 transition-colors"
                >
                  + File
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddNestedFolder(section.id, item.id);
                  }}
                  className="px-2 py-1 bg-yellow-500 text-xs text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  + Folder
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditNestedFolder(section.id, item.id);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <FaPencilAlt className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNestedFolder(section.id, item.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="ml-4 p-2 space-y-2">
            {(item.items || []).length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-sm">
                Empty folder
              </div>
            ) : (
              (item.items || []).map(nestedItem => (
                <div key={nestedItem.id}>
                  {renderNestedContent(section, nestedItem)}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // File item
    return (
      <div 
        className="flex items-center p-3 bg-gray-750 rounded-lg hover:bg-gray-700 transition-all cursor-pointer group"
        onClick={() => handleFileClick(section.id, item.id)}
      >
        <div className="mr-3">
          {React.cloneElement(item.icon || <Code2 />, {
            className: `w-8 h-8 ${getLanguageColor(item.language)}`
          })}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate text-sm">
            {item.name}
          </h3>
          <p className="text-xs text-gray-400 truncate">
            {item.language}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const parentFolderId = item.folderId !== section.id ? item.folderId : null;
              if (parentFolderId) {
                handleDeleteNestedFile(e, section.id, parentFolderId, item.id);
              } else {
                handleDeleteFile(e, section.id, item.id);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
          >
            <FaTrash className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditFile(e, section.id, item.id);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <FaPencilAlt className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#031d38] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wide">My Playground</h1>
          <div className="flex gap-4">
            <motion.button 
              onClick={handleAddFolder}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-[#1E88E5] text-white rounded-lg hover:bg-[#1976D2] 
              transition-colors flex items-center gap-2 border border-[#1E4976]"
            >
              <span className="text-lg">+</span>
              New Folder
            </motion.button>
            <motion.button 
              onClick={cleanupAllFiles}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-[#E44D26] text-white rounded-lg hover:bg-[#D32F2F] 
              transition-colors border border-[#1E4976]"
            >
              Cleanup Files
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playgrounds.map((section) => (
            <div key={section.id} className="bg-[#132F4C] rounded-xl shadow-lg overflow-hidden border border-[#1E4976]">
              {/* Folder Header */}
              <div className="p-4 bg-[#0A1929] border-b border-[#1E4976]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFolder className="text-xl text-[#64B5F6]" />
                    <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button 
                      onClick={() => handleAddNestedFolder(section.id)}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-[#1E88E5] text-sm text-white rounded hover:bg-[#1976D2] transition-colors"
                    >
                      + Folder
                    </motion.button>
                    <motion.button 
                      onClick={() => handleAddFile(section.id)}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-[#1E88E5] text-sm text-white rounded hover:bg-[#1976D2] transition-colors"
                    >
                      + File
                    </motion.button>
                    <button
                      onClick={() => handleEditFolder(section.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FaPencilAlt className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(section.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Folder Content */}
              <div className="p-4 space-y-3">
                {section.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No items in this folder
                  </div>
                ) : (
                  section.items.map((item) => (
                    <div key={item.id} className="bg-[#0A1929] rounded-lg p-3 border border-[#1E4976]">
                      {renderNestedContent(section, item)}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Projects
