import { loader } from '@monaco-editor/react';

loader.config({
  paths: {
    vs: 'https://unpkg.com/monaco-editor@0.36.1/min/vs',
  },
  'vs/nls': {
    availableLanguages: {}
  }
});

if (!window.monacoLoaded) {
  loader.init().then((monaco) => {
    window.monacoLoaded = true;
    console.log('Monaco editor loaded successfully');
    
    if (monaco && monaco.editor) {
      try {
        monaco.editor.EditorOptions.textDirection = { defaultValue: 'ltr' };
      } catch (error) {
        console.error('Error configuring Monaco editor:', error);
      }
    }
  }).catch(error => {
    console.error('Monaco initialization error:', error);
  });
}

export const editorOptions = {
  fontSize: 19,
  fontFamily: "'Consolas', 'Courier New', monospace",
  lineNumbers: 'on',
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on',
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  cursorSmoothCaretAnimation: 'on',
  formatOnPaste: false,
  formatOnType: false,
  renderWhitespace: 'none',
  renderControlCharacters: false,
  renderIndentGuides: true,
  textDirection: 'ltr',
  fontLigatures: false,
  disableMonospaceOptimizations: true,
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoSurround: 'never'
};
