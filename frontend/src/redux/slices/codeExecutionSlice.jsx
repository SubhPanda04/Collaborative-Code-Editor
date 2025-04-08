import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  input: '',
  output: '',
  isExecuting: false,
  executionError: null
};

const codeExecutionSlice = createSlice({
  name: 'codeExecution',
  initialState,
  reducers: {
    setInput: (state, action) => {
      state.input = action.payload;
    },
    setOutput: (state, action) => {
      state.output = action.payload;
    },
    clearOutput: (state) => {
      state.output = '';
    },
    setExecuting: (state, action) => {
      state.isExecuting = action.payload;
    },
    setExecutionError: (state, action) => {
      state.executionError = action.payload;
    },
    clearExecutionError: (state) => {
      state.executionError = null;
    },
    resetExecution: (state) => {
      state.output = '';
      state.isExecuting = false;
      state.executionError = null;
    }
  },
});

export const { 
  setInput, 
  setOutput, 
  clearOutput,
  setExecuting, 
  setExecutionError,
  clearExecutionError,
  resetExecution
} = codeExecutionSlice.actions;

export default codeExecutionSlice.reducer; 