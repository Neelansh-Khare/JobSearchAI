// Background service worker for JobSearchAI extension

const API_BASE_URL = 'http://localhost:8000';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_JOB') {
    handleSaveJob(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleSaveJob(jobData) {
  const { token } = await chrome.storage.local.get('token');
  
  if (!token) {
    throw new Error('Please log in via the extension popup first.');
  }

  const response = await fetch(`${API_BASE_URL}/jobs/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to save job to tracker');
  }

  return await response.json();
}
