
// handles the icon's visual active inactive state (color vs. grayscale)

let iconsData = {};

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
  } else {
    setActionIcon(tab.id, 'gray');
    await chrome.action.disable(tab.id);
  }
}


generateIconImageData();


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
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

// Fired when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, tabs => {
    if (!chrome.runtime.lastError) {
      for (const tab of tabs) {
        updateActionState(tab);
      }
    }
  });
});
