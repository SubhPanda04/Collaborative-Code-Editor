import React from 'react';
import { 
  FaFolder, 
  FaChevronDown, 
  FaChevronRight, 
  FaTrash, 
  FaPencilAlt,
  FaJs,
  FaPython,
  FaJava,
  FaHtml5,
  FaCss3,
  FaPlus
} from 'react-icons/fa';
import { SiTypescript, SiCplusplus, SiRust, SiGo } from 'react-icons/si';
import { Code2 } from 'lucide-react';

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

const NestedItem = ({
  item,
  folderId,
  parentId,
  onDeleteItem,
  onEditItem,
  handleFileClick,
  expandedFolders,
  toggleFolder,
  onCreateFile,
  onCreateFolder,
  level = 0
}) => {
  const isFolder = item.type === 'folder';
  const isExpanded = expandedFolders.has(item.id);

  const handleCreateFile = (e) => {
    e.stopPropagation();
    const fileName = prompt('Enter file name (with extension):');
    if (fileName) {
      onCreateFile(item.id, fileName);
    }
  };

  const handleCreateFolder = (e) => {
    e.stopPropagation();
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      onCreateFolder(item.id, folderName);
    }
  };

  return (
    <div className={`pl-${level > 0 ? '4' : '0'}`}>
      <div className="flex items-center gap-2 py-2 hover:bg-gray-700 rounded-lg px-2">
        {isFolder ? (
          <button 
            onClick={() => toggleFolder(item.id)}
            className="hover:bg-gray-600 p-1 rounded"
          >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        ) : null}
        <div
          className="flex-1 flex items-center gap-2 cursor-pointer"
          onClick={() => !isFolder && handleFileClick(folderId, item.id)}
        >
          {isFolder ? (
            <FaFolder className="text-blue-500" />
          ) : (
            getFileIcon(item.name)
          )}
          <span className="text-gray-200">{item.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isFolder && (
            <>
              <button
                onClick={handleCreateFile}
                className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-blue-500"
                title="Create File"
              >
                <FaPlus size={12} />
                <Code2 size={12} className="inline ml-1" />
              </button>
              <button
                onClick={handleCreateFolder}
                className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-blue-500"
                title="Create Folder"
              >
                <FaPlus size={12} />
                <FaFolder size={12} className="inline ml-1" />
              </button>
            </>
          )}
          <button
            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteItem(folderId, item.id);
            }}
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
          <button
            className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              onEditItem(folderId, item.id);
            }}
            title="Rename"
          >
            <FaPencilAlt size={14} />
          </button>
        </div>
      </div>
      {isFolder && isExpanded && item.items && (
        <div className="pl-4">
          {item.items.map((subItem) => (
            <NestedItem
              key={subItem.id}
              item={subItem}
              folderId={folderId}
              parentId={item.id}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              handleFileClick={handleFileClick}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NestedItem;
