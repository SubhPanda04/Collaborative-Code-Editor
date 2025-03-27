import React from 'react';
import { FaUser, FaUsers } from 'react-icons/fa';

const getRandomColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

const UserAvatar = ({ name }) => {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
    
  const bgColor = getRandomColor(name);
  
  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
};

const Collaborators = ({ users = [] }) => {
  if (!users || users.length === 0) {
    return (
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <FaUsers />
          <span>No active collaborators</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <FaUsers className="text-blue-400" />
        <span className="text-white font-medium">Collaborators ({users.length})</span>
      </div>
      
      <div className="space-y-2">
        {users.map((user, index) => (
          <div key={index} className="flex items-center gap-2">
            <UserAvatar name={user} />
            <span className="text-gray-200 text-sm">{user}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collaborators;