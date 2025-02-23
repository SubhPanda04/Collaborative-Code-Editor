import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
  }
});

loader.init().then(monaco => {
  monaco.languages.setLanguageConfiguration('python', {
    comments: {
      lineComment: '#',
      blockComment: ['"""', '"""']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    indentationRules: {
      increaseIndentPattern: new RegExp('^\\s*((class|def|elif|else|except|finally|for|if|try|while|with)\\b.*:\\s*$|\\s*\\{\\s*$)'),
      decreaseIndentPattern: new RegExp('^\\s*}\\s*$')
    },
    folding: {
      markers: {
        start: new RegExp('^\\s*#region\\b'),
        end: new RegExp('^\\s*#endregion\\b')
      }
    }
  });

  monaco.editor.defineTheme('vs-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '#569CD6' },
      { token: 'string', foreground: '#CE9178' },
      { token: 'comment', foreground: '#6A9955' },
      { token: 'number', foreground: '#B5CEA8' },
      { token: 'operator', foreground: '#D4D4D4' },
      { token: 'function', foreground: '#DCDCAA' },
      { token: 'class-name', foreground: '#4EC9B0' }
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editorCursor.foreground': '#AEAFAD',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorWhitespace.foreground': '#3B3B3B'
    }
  });

  monaco.editor.defineTheme('light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '#0000FF' },
      { token: 'string', foreground: '#A31515' },
      { token: 'comment', foreground: '#008000' },
      { token: 'number', foreground: '#098658' },
      { token: 'operator', foreground: '#000000' },
      { token: 'function', foreground: '#795E26' },
      { token: 'class-name', foreground: '#267F99' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorCursor.foreground': '#000000',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1'
    }
  });

  monaco.editor.defineTheme('hc-black', {
    base: 'hc-black',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#FFFFFF',
      'editorCursor.foreground': '#FFFFFF',
      'editor.selectionBackground': '#FFFFFF',
      'editor.selectionForeground': '#000000'
    }
  });
});

export default loader;
