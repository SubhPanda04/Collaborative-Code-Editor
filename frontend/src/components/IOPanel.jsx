import React, { useState } from 'react';
import { FaTerminal, FaKeyboard } from 'react-icons/fa';

const IOPanel = ({ type = 'output' }) => {
  const [content, setContent] = useState('');
  const isOutput = type === 'output';
  
  return (
    <div className="h-full w-full flex flex-col bg-[#031d38]">
      {/* Header - made slightly smaller */}
      <div className="flex items-center px-4 py-1 border-b border-[#1E4976] bg-[#031d38]">
        <div className="flex items-center gap-2 text-sm text-white">
          {isOutput ? (
            <>
              <FaTerminal className="text-gray-400" />
              <span>Output</span>
            </>
          ) : (
            <>
              <FaKeyboard className="text-gray-400" />
              <span>Input</span>
            </>
          )}
        </div>
      </div>

      {/* Content - improved padding and styling */}
      <div className="flex-1 p-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={isOutput}
          className="w-full h-full bg-[#132F4C] text-white p-3 rounded-md 
            border border-[#1E4976] focus:outline-none focus:border-blue-500
            font-mono text-sm resize-none"
          placeholder={isOutput ? "Program output will appear here..." : "Enter program input here..."}
        />
      </div>
    </div>
  );
};

export default IOPanel;
