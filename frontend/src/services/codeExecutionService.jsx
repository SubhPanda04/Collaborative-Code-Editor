/**
 * Service for code execution using JudgeO CE API
 */

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';

// Map file extensions to JudgeO language IDs
const languageMap = {
  'js': 63,    // JavaScript (Node.js 12.14.0)
  'jsx': 63,   // JavaScript (Node.js 12.14.0)
  'py': 71,    // Python (3.8.1)
  'java': 62,  // Java (OpenJDK 13.0.1)
  'c': 50,     // C (GCC 9.2.0)
  'cpp': 54,   // C++ (GCC 9.2.0)
  'cs': 51,    // C# (Mono 6.6.0.161)
  'go': 60,    // Go (1.13.5)
  'rb': 72,    // Ruby (2.7.0)
  'rs': 73,    // Rust (1.40.0)
  'ts': 74,    // TypeScript (3.7.4)
  'php': 68,   // PHP (7.4.1)
};

// Get language ID based on file extension
export const getLanguageId = (fileName) => {
  if (!fileName) return 63; // Default to JavaScript
  const extension = fileName.split('.').pop().toLowerCase();
  return languageMap[extension] || 63; // Default to JavaScript if extension not found
};

// Submit code for execution
export const executeCode = async (code, language, input = '') => {
  try {
    // Step 1: Create a submission
    const createSubmissionResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.REACT_APP_JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code: code,
        language_id: language,
        stdin: input,
        wait: false  // We'll poll for results
      })
    });

    if (!createSubmissionResponse.ok) {
      throw new Error(`Error creating submission: ${createSubmissionResponse.statusText}`);
    }

    const { token } = await createSubmissionResponse.json();
    
    // Step 2: Poll for results
    let result;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      
      const getResultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.REACT_APP_JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });
      
      if (!getResultResponse.ok) {
        throw new Error(`Error getting submission result: ${getResultResponse.statusText}`);
      }
      
      result = await getResultResponse.json();
      
      // Check if processing is complete
      if (result.status && (result.status.id >= 3)) { // Status ID 3 or greater means finished
        break;
      }
    }
    
    return {
      success: true,
      output: result.stdout || '',
      error: result.stderr || result.message || '',
      statusId: result.status?.id
    };
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      success: false,
      output: '',
      error: error.message || 'An error occurred during code execution',
      statusId: null
    };
  }
}; 