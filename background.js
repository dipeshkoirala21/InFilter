

// handles the icon's visual active inactive state (color vs. grayscale)

let iconsData = {};
// A persistent store for the last known badge count for each tab.
let tabBadgeCounts = {};

async function generateIconImageData() {

  if (Object.keys(iconsData).length > 0) return;

  const iconSizes = [16, 48, 128];
  for (const size of iconSizes) {
    const path = `icons/icon${size}.png`;
    try {

      const offscreen = new OffscreenCanvas(size, size);
      const ctx = offscreen.getContext('2d');
      
    
      const img = await createImageBitmap(await (await fetch(path)).blob());
      ctx.drawImage(img, 0, 0, size, size);
      const colorData = ctx.getImageData(0, 0, size, size);
      const grayData = ctx.getImageData(0, 0, size, size);
      for (let i = 0; i < grayData.data.length; i += 4) {
        // Use the standard luminosity method for grayscale conversion
        const luminosity = 0.299 * grayData.data[i] + 0.587 * grayData.data[i + 1] + 0.114 * grayData.data[i + 2];
        grayData.data[i] = luminosity;     // Red
        grayData.data[i + 1] = luminosity; // Green
        grayData.data[i + 2] = luminosity; // Blue
      }
      
      // Store both versions
      iconsData[size] = { color: colorData, gray: grayData };

    } catch (e) {
      console.error(`InFilter: Failed to load or process icon ${path}`, e);
    }
  }
}

// A helper function to set the action icon for a specific tab.
function setActionIcon(tabId, type) { // type is 'color' or 'gray'
  if (Object.keys(iconsData).length === 0) return; // Don't run if icons haven't been processed
  
  try {
    chrome.action.setIcon({
      tabId: tabId,
      imageData: {
        "16": iconsData[16][type],
        "48": iconsData[48][type],
        "128": iconsData[128][type]
      }
    });
  } catch (e) {
      // This can happen if the tab is closed, etc.
  }
}

async function updateActionState(tab) {
  if (!tab || !tab.id) return;
  
  const isLinkedIn = tab.url && tab.url.startsWith('https://www.linkedin.com/');

  if (isLinkedIn) {
    setActionIcon(tab.id, 'color');
    await chrome.action.enable(tab.id);

    // Restore the badge from memory if it exists for this tab
    const lastCount = tabBadgeCounts[tab.id] || 0;
    const text = lastCount > 0 ? String(lastCount) : '';
    try {
        await chrome.action.setBadgeText({ tabId: tab.id, text: text });
    } catch(e) { /* Tab might be gone */ }
  } else {
    setActionIcon(tab.id, 'gray');
    await chrome.action.disable(tab.id);
    
    // Clear the badge and the stored count when not on LinkedIn
    try {
      await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
      delete tabBadgeCounts[tab.id]; // Clean up memory
    } catch(e) { /* Tab might be gone */ }
  }
}

// --- Event Listeners ---

// Listen for messages from content scripts (e.g., to update the badge)
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'UPDATE_BADGE' && sender.tab && sender.tab.id) {
    const tabId = sender.tab.id;
    const count = message.count || 0;
    const text = count > 0 ? String(count) : '';
    
    // Store the latest count for this tab for persistence during navigation
    tabBadgeCounts[tabId] = count;
    
    // Set badge text for the specific tab that sent the message
    chrome.action.setBadgeText({
      tabId: tabId,
      text: text
    });
  }
});


// Initialize icons when the service worker first starts up.
generateIconImageData();


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Use 'loading' status to update the icon state as early as possible
  if (changeInfo.status === 'loading' && tab.url) {
    updateActionState(tab);
  }
});

// Fired when the user switches to a different tab.
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (!chrome.runtime.lastError) {
      updateActionState(tab);
    }
  });
});

// Fired when a tab is closed.
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up the stored count for the closed tab to prevent memory leaks.
  delete tabBadgeCounts[tabId];
});

// Fired when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  // Set the badge background color
  chrome.action.setBadgeBackgroundColor({ color: '#6c757d' }); // A neutral gray from the popup CSS

  // Ensure all currently open tabs have the correct icon state.
  chrome.tabs.query({}, tabs => {
    if (!chrome.runtime.lastError) {
      for (const tab of tabs) {
        updateActionState(tab);
      }
    }
  });
});
