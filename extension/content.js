// Content script for LinkedIn job pages

console.log('JobSearchAI Content Script Loaded');

// Function to add the "Save to JobSearchAI" button
function addSaveButton() {
  // Check if button already exists
  if (document.getElementById('jobsearchai-save-btn')) return;

  // Find the LinkedIn "Apply" button container
  const actionsContainer = document.querySelector('.jobs-apply-button--top-card') || 
                           document.querySelector('.jobs-save-button') ||
                           document.querySelector('.jobs-unified-top-card__content--two-pane .display-flex');

  if (actionsContainer) {
    const saveBtn = document.createElement('button');
    saveBtn.id = 'jobsearchai-save-btn';
    saveBtn.innerText = '✨ Save to Tracker';
    saveBtn.style.cssText = `
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 1600px;
      padding: 0 24px;
      height: 40px;
      font-weight: 600;
      margin-left: 8px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    `;
    
    saveBtn.onmouseover = () => saveBtn.style.opacity = '0.9';
    saveBtn.onmouseout = () => saveBtn.style.opacity = '1';
    
    saveBtn.onclick = handleSave;
    
    actionsContainer.parentElement.appendChild(saveBtn);
  }
}

async function handleSave() {
  const btn = document.getElementById('jobsearchai-save-btn');
  const originalText = btn.innerText;
  btn.innerText = '⏳ Saving...';
  btn.disabled = true;

  try {
    const jobData = {
      title: document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText || 
             document.querySelector('h1')?.innerText || '',
      company: document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText || 
               document.querySelector('.jobs-unified-top-card__company-name')?.innerText || '',
      location: document.querySelector('.job-details-jobs-unified-top-card__bullet')?.innerText || 
                document.querySelector('.jobs-unified-top-card__bullet')?.innerText || '',
      description: document.querySelector('.jobs-description__content')?.innerText || 
                   document.querySelector('#job-details')?.innerText || '',
      url: window.location.href,
      source: 'LinkedIn',
      status: 'Saved'
    };

    // Send to background script to handle API call (to avoid CORS issues and use stored token)
    chrome.runtime.sendMessage({ type: 'SAVE_JOB', data: jobData }, (response) => {
      if (response && response.success) {
        btn.innerText = '✅ Saved!';
        btn.style.background = '#10b981';
      } else {
        btn.innerText = '❌ Error';
        btn.style.background = '#ef4444';
        console.error('Save failed:', response?.error);
        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          btn.disabled = false;
        }, 3000);
      }
    });
  } catch (error) {
    btn.innerText = '❌ Error';
    console.error('Error saving job:', error);
  }
}

// Run on load and whenever the URL changes (LinkedIn is a SPA)
addSaveButton();
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(addSaveButton, 2000); // Wait for LinkedIn to render
  }
}).observe(document, {subtree: true, childList: true});

// Also try periodic checks because LinkedIn's dynamic loading can be tricky
setInterval(addSaveButton, 3000);
