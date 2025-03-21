import { loader } from '@monaco-editor/react';

// Configure the loader to use a specific version from unpkg CDN (more reliable than jsdelivr)
loader.config({
  paths: {
    vs: 'https://unpkg.com/monaco-editor@0.36.1/min/vs',
  },
  'vs/nls': {
    availableLanguages: {
      '*': 'en'
    }
  },
  // Ensure workers are loaded from the same CDN
  'vs/editor/editor.worker': 'https://unpkg.com/monaco-editor@0.36.1/min/vs/editor/editor.worker.js',
  'vs/language/json/json.worker': 'https://unpkg.com/monaco-editor@0.36.1/min/vs/language/json/json.worker.js',
  'vs/language/css/css.worker': 'https://unpkg.com/monaco-editor@0.36.1/min/vs/language/css/css.worker.js',
  'vs/language/html/html.worker': 'https://unpkg.com/monaco-editor@0.36.1/min/vs/language/html/html.worker.js',
  'vs/language/typescript/ts.worker': 'https://unpkg.com/monaco-editor@0.36.1/min/vs/language/typescript/ts.worker.js'
});

// Initialize with specific cursor handling
loader.init().then((monaco) => {
  console.log('Monaco editor loaded successfully');
  
  // Override default cursor behavior if monaco is available
  if (monaco && monaco.editor) {
    try {
      // Force LTR text direction globally
      monaco.editor.EditorOptions.textDirection = { defaultValue: 'ltr' };
    } catch (error) {
      console.error('Error configuring Monaco editor:', error);
    }
  }
});

// Add specific editor options to fix cursor positioning
export const editorOptions = {
  fontSize: 19,
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
  
  // Additional options to improve editor performance
  renderWhitespace: 'none',
  renderControlCharacters: false,
  renderIndentGuides: true,
  
  // Force LTR text direction
  textDirection: 'ltr',
  
  // Disable ligatures which can cause cursor positioning issues
  fontLigatures: false,
  
  // Disable RTL mirroring
  disableMonospaceOptimizations: true,
  
  // Ensure proper bracket handling
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'never'
};
