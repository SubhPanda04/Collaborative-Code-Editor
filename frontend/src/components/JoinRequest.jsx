import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes } from 'react-icons/fa';

const JoinRequest = ({ userName, onAccept, onReject }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-blue-900 border border-blue-700 rounded-md p-3 mb-2 shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white text-sm font-medium">
            <span className="text-blue-300">{userName}</span> wants to join
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-md"
            title="Accept"
          >
            <FaCheck size={14} />
          </button>
          <button 
            onClick={onReject}
            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-md"
            title="Reject"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default JoinRequest;