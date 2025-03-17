import { loader } from '@monaco-editor/react';

// Configure the loader to use a specific version from CDN
loader.config({
  paths: {
    // Use a stable version that's known to work well with cursor positioning
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs'
  },
  // Ensure Monaco loads completely before rendering
  'vs/nls': {
    availableLanguages: {
      '*': 'en'
    }
  }
});

// Initialize without custom configurations that might interfere with cursor
loader.init().then(() => {
  console.log('Monaco editor loaded successfully');
});
