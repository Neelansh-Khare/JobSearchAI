const API_BASE_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', async () => {
  const loginSection = document.getElementById('login-section');
  const jobSection = document.getElementById('job-section');
  const notJobPage = document.getElementById('not-job-page');
  const statusDiv = document.getElementById('status');
  const loader = document.getElementById('loader');

  // Check if user is logged in
  const { token } = await chrome.storage.local.get('token');

  if (!token) {
    showSection(loginSection);
  } else {
    checkCurrentPage();
  }

  // Login handler
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      statusDiv.textContent = 'Please enter email and password';
      return;
    }

    loader.style.display = 'block';
    statusDiv.textContent = 'Logging in...';

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      await chrome.storage.local.set({ token: data.access_token });
      
      statusDiv.textContent = 'Login successful!';
      showSection(null);
      checkCurrentPage();
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
    } finally {
      loader.style.display = 'none';
    }
  });

  // Save job handler
  document.getElementById('save-btn').addEventListener('click', async () => {
    const { currentJob } = await chrome.storage.local.get('currentJob');
    const { token } = await chrome.storage.local.get('token');

    if (!currentJob || !token) {
      statusDiv.textContent = 'Missing job data or token';
      return;
    }

    loader.style.display = 'block';
    statusDiv.textContent = 'Saving job...';

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: currentJob.title,
          company: currentJob.company,
          location: currentJob.location,
          description: currentJob.description,
          url: currentJob.url,
          source: 'LinkedIn',
          status: 'Saved'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      statusDiv.textContent = 'Job saved successfully!';
      document.getElementById('save-btn').disabled = true;
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
    } finally {
      loader.style.display = 'none';
    }
  });

  async function checkCurrentPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linkedin.com/jobs')) {
      showSection(notJobPage);
      return;
    }

    statusDiv.textContent = 'Extracting job details...';
    
    try {
      // Inject content script if not already there and ask for data
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractJobData
      });

      if (results && results[0] && results[0].result) {
        const jobData = results[0].result;
        jobData.url = tab.url;
        await chrome.storage.local.set({ currentJob: jobData });
        
        document.getElementById('job-title').textContent = jobData.title;
        document.getElementById('job-company').textContent = jobData.company;
        showSection(jobSection);
        statusDiv.textContent = '';
      } else {
        statusDiv.textContent = 'Could not extract job details. Make sure you are on a job details page.';
      }
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
    }
  }

  function showSection(section) {
    [loginSection, jobSection, notJobPage].forEach(s => s.style.display = 'none');
    if (section) section.style.display = 'block';
  }
});

// This function is injected into the page
function extractJobData() {
  try {
    const title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText || 
                  document.querySelector('h1')?.innerText || '';
    const company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText || 
                    document.querySelector('.jobs-unified-top-card__company-name')?.innerText || '';
    const location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.innerText || 
                     document.querySelector('.jobs-unified-top-card__bullet')?.innerText || '';
    const description = document.querySelector('.jobs-description__content')?.innerText || 
                        document.querySelector('#job-details')?.innerText || '';

    return { title, company, location, description };
  } catch (e) {
    return null;
  }
}
