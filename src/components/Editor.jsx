import React from 'react';
import MonacoEditor from '@monaco-editor/react';

const Editor = ({ language, theme, value, onChange }) => {
  const handleEditorChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        width="100%"
        language={language}
        theme={theme}
        value={value || '// Start coding here...'}
        onChange={handleEditorChange}
        options={{
          fontSize: 22,
          fontFamily: 'Space Grotesk, monospace',
          fontLigatures: true,
          minimap: { enabled: true },
          wordWrap: 'on',
          lineHeight: 33,
          letterSpacing: 0.5,
          padding: { top: 20, bottom: 20 },
          showUnused: false,
          folding: true,
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: 'none',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            bracketPairs: true,
            indentation: true
          }
        }}
      />
    </div>
  );
};

export default Editor;
