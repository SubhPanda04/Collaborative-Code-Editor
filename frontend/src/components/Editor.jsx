import React, { useEffect, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
import { setFileContent, clearUnsavedChanges } from '../redux/slices/editorSlice'; // Add clearUnsavedChanges
import { editorOptions } from '../config/editorConfig';
import { debounce } from 'lodash';
import { Code2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

// Helper function to determine language from file name
const getLanguageFromFileName = (fileName) => {
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

const Editor = () => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const dispatch = useDispatch();
  const { currentFile, activeFiles, selectedTheme } = useSelector((state) => state.editor);
  const { currentFolder } = useSelector((state) => state.fileSystem);
  
  const currentContent = currentFile ? activeFiles[currentFile.id] : '';
  const editorLanguage = currentFile ? getLanguageFromFileName(currentFile.name) : 'plaintext';

  // Create a debounced update function
  // Modify the debouncedUpdate function to save to Firestore
  const debouncedUpdate = useCallback(
    debounce(async (fileId, content) => {
      try {
        const folderRef = doc(db, "playgrounds", currentFolder.id);
        
        // Create a function to update nested file content
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

        // Update the folder document with new file content
        await updateDoc(folderRef, {
          items: updateNestedFileContent(currentFolder.items)
        });

        // Clear unsaved changes indicator
        dispatch(clearUnsavedChanges(fileId));
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }, 1000),
    [currentFolder]
  );

  const handleEditorChange = (value) => {
    if (!currentFile || !currentFolder) return;
    
    // Update Redux store
    dispatch(setFileContent({ 
      fileId: currentFile.id, 
      content: value 
    }));

    // Save to database
    debouncedUpdate(currentFile.id, value);
  };

  // Fix cursor position when editor mounts
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Apply direct fixes to the editor instance
    try {
      // Force LTR text direction
      editor.getModel().updateOptions({ 
        tabSize: 2,
        insertSpaces: true,
        trimAutoWhitespace: true,
        detectIndentation: false
      });
      
      // Apply custom theme with LTR text direction
      monaco.editor.defineTheme('fixedCursorTheme', {
        base: selectedTheme === 'light' ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [],
        colors: {}
      });
      
      monaco.editor.setTheme('fixedCursorTheme');
      
      // Update editor options directly
      editor.updateOptions({
        cursorStyle: 'line',
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        formatOnPaste: false,
        formatOnType: false,
        fontFamily: "'Consolas', 'Courier New', monospace",
        disableMonospaceOptimizations: true,
        fontLigatures: false,
        textDirection: 'ltr'
      });
      
      // Force a layout update
      setTimeout(() => {
        editor.layout();
        editor.focus();
      }, 100);
    } catch (error) {
      console.error('Error configuring editor:', error);
    }
  };

  // Update editor when theme changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      try {
        monacoRef.current.editor.defineTheme('fixedCursorTheme', {
          base: selectedTheme === 'light' ? 'vs' : 'vs-dark',
          inherit: true,
          rules: [],
          colors: {}
        });
        
        monacoRef.current.editor.setTheme('fixedCursorTheme');
      } catch (error) {
        console.error('Error updating theme:', error);
      }
    }
  }, [selectedTheme]);

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
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage={editorLanguage}
        language={editorLanguage}
        value={currentContent}
        theme={selectedTheme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 21,
          fontFamily: "'Consolas', 'Courier New', monospace",
          lineNumbers: 'on',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          
          // These options help fix cursor positioning issues
          cursorStyle: 'line',
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          
          // Disable features that might affect cursor positioning
          formatOnPaste: false,
          formatOnType: false,
          
          // Force LTR text direction
          textDirection: 'ltr',
          
          // Disable ligatures which can cause cursor positioning issues
          fontLigatures: false,
          
          // Disable RTL mirroring
          disableMonospaceOptimizations: true
        }}
        key={currentFile.id}
      />
    </div>
  );
};

export default Editor;
