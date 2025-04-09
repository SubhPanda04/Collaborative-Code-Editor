// src/utils/compileCode.jsx
import axios from 'axios';

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true';

const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
  typescript: 74,
  html: 60,
  css: 50,
  cpp: 54,
  rust: 73,
  go: 60,
  c: 50,
};

export const compileCode = async ({ code, language, input }) => {
  const encodedCode = btoa(code);
  const encodedInput = btoa(input || '');

  const languageId = languageMap[language.toLowerCase()];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const options = {
    method: 'POST',
    url: JUDGE0_API,
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': '0b8bdee6afmsh5a87dc9d32d5469p1c0aeejsn3f036dd9ffed', 
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    data: {
      source_code: encodedCode,
      language_id: languageId,
      stdin: encodedInput,
    }
  };

  const response = await axios.request(options);
  return response.data;
};