import React, { useState } from 'react'
import { FaFolder, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const [playgrounds, setPlaygrounds] = useState([
    {
      id: 1,
      title: 'DSA',
      items: [
        {
          id: 1,
          name: 'Stack Implementation',
          language: 'cpp',
          icon: <Code2 className="w-12 h-12 text-blue-500" />
        },
        {
          id: 2,
          name: 'Language: javascript',
          language: 'javascript',
          icon: <Code2 className="w-12 h-12 text-yellow-500" />
        }
      ]
    },
    {
      id: 2,
      title: 'capstone',
      items: [
        {
          id: 3,
          name: 'ravi',
          language: 'cpp',
          icon: <Code2 className="w-12 h-12 text-blue-500" />
        }
      ]
    },
    {
      id: 3,
      title: 'webdev',
      items: [
        {
          id: 4,
          name: 'text',
          language: 'cpp',
          icon: <Code2 className="w-12 h-12 text-blue-500" />
        },
        {
          id: 5,
          name: 'ravi',
          language: 'cpp',
          icon: <Code2 className="w-12 h-12 text-blue-500" />
        }
      ]
    }
  ]);

  const handleDeleteFolder = (folderId) => {
    setPlaygrounds(playgrounds.filter(folder => folder.id !== folderId));
  };

  const handleDeleteFile = (e, folderId, fileId) => {
    e.stopPropagation();
    setPlaygrounds(playgrounds.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          items: folder.items.filter(item => item.id !== fileId)
        };
      }
      return folder;
    }));
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

  const handleAddFolder = () => {
    const title = prompt('Enter folder name:');
    if (title) {
      const newFolder = {
        id: Date.now(),
        title,
        items: []
      };
      setPlaygrounds([...playgrounds, newFolder]);
    }
  };

  const handleAddFile = (folderId) => {
    const name = prompt('Enter file name:');
    if (!name) return;

    const language = prompt(`Choose language (${languages.join(', ')}):`, 'javascript');
    if (!language || !languages.includes(language.toLowerCase())) return;

    const newFile = {
      id: Date.now(),
      name,
      language: language.toLowerCase(),
      icon: <Code2 className={`w-12 h-12 ${getLanguageColor(language.toLowerCase())}`} />
    };

    setPlaygrounds(playgrounds.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          items: [...folder.items, newFile]
        };
      }
      return folder;
    }));
  };

  const handleFileClick = (folderId, fileId) => {
    navigate(`/editor/${folderId}/${fileId}`);
  };  
  return (
    <>
      <div className='text-primaryText'>
        Projects
      </div>

      <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Playground</h1>
          <button 
            onClick={handleAddFolder}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            + New Folder
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playgrounds.map((section) => (
            <div key={section.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden w-full">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFolder className="text-xl text-blue-500" />
                    <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaTrash 
                      className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                      onClick={() => handleDeleteFolder(section.id)}
                    />
                    <FaPencilAlt 
                      className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                      onClick={() => handleEditFolder(section.id)}
                    />
                    <button 
                      onClick={() => handleAddFile(section.id)}
                      className="px-3 py-1 bg-blue-500 text-sm text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      + Add New File
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all cursor-pointer group"
                      onClick={() => handleFileClick(section.id, item.id)}
                    >
                      <div className="mr-3">
                        {React.cloneElement(item.icon, {
                          className: `w-12 h-12 ${getLanguageColor(item.language)}`
                        })}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">Language: {item.language}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <FaTrash 
                          className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                          onClick={(e) => handleDeleteFile(e, section.id, item.id)}
                        />
                        <FaPencilAlt 
                          className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                          onClick={(e) => handleEditFile(e, section.id, item.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}

export default Projects
