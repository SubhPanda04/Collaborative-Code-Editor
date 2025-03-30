import { loader } from '@monaco-editor/react';

// Configure Monaco loader with a more reliable CDN
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs',
  },
  'vs/nls': {
    availableLanguages: {}
  }
});

// Initialize Monaco only once
if (!window.monacoLoaded) {
  loader.init()
    .then((monaco) => {
      window.monacoLoaded = true;
      console.log('Monaco editor loaded successfully');
      
      if (monaco && monaco.editor) {
        try {
          // Set default options
          monaco.editor.EditorOptions.textDirection = { defaultValue: 'ltr' };
          
          // Define a default theme that works in all environments
          monaco.editor.defineTheme('defaultTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {}
          });
          
          monaco.editor.setTheme('defaultTheme');
        } catch (error) {
          console.error('Error configuring Monaco editor:', error);
        }
      }
    })
    .catch(error => {
      console.error('Monaco initialization error:', error);
    });
}

export const editorOptions = {
  fontSize: 16,
  fontFamily: "'Consolas', 'Courier New', monospace",
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on',
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  cursorSmoothCaretAnimation: 'on',
  lineHeight: 24,
  letterSpacing: 0.5,
  padding: { top: 10, bottom: 10 },
  formatOnPaste: true,
  formatOnType: true,
  renderWhitespace: 'selection',
  renderControlCharacters: false,
  renderIndentGuides: true,
  smoothScrolling: true,
  mouseWheelZoom: true,
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'languageDefined'
};
