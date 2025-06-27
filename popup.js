

document.addEventListener('DOMContentLoaded', () => {
    // Tab Elements
    const tabButtons = document.querySelectorAll('.infilter-tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const infoTabButtonHeader = document.getElementById('info-tab-button-header');
    const infoTabButtonNav = document.getElementById('info-tab-button-nav');


    // Time Filter Elements
    const timeFilterPillsContainer = document.getElementById('time-filter-pills');
    const customHoursInput = document.getElementById('custom-hours-input');
    const applyTimeFilterButton = document.getElementById('apply-time-filter-button');
    const defaultTimeOptions = [
        { label: "1hr", value: 1 }, { label: "2hr", value: 2 }, { label: "5hr", value: 5 },
        { label: "10hr", value: 10 }, { label: "15hr", value: 15 }, { label: "22hr", value: 22 }
    ];
    let selectedTimePillValue = null;

    // Company Blocker Elements
    const companyBlockInput = document.getElementById('company-block-input');
    const addCompanyButton = document.getElementById('add-company-button');
    const blockedCompaniesList = document.getElementById('blocked-companies-list');

    // Info Tab Elements
    const supportButton = document.getElementById('support-button');

    // --- Tab Navigation ---
    function setActiveTab(tabId) {
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
            pane.hidden = true;
        });
        tabButtons.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });

        const activePane = document.getElementById(tabId);
        const activeButton = document.querySelector(`.infilter-tab-button[data-tab="${tabId}"]`);

        if (activePane) {
            activePane.classList.add('active');
            activePane.hidden = false;
        }
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-selected', 'true');
        }
        // Save the active tab ID to storage for persistence
        chrome.storage.local.set({ activeTabId: tabId });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveTab(button.dataset.tab);
        });
    });
    
    infoTabButtonHeader.addEventListener('click', () => {
        setActiveTab('infoTab');
    });


    // --- Time Filter Pill Generation ---
    function renderTimeFilterPills() {
        timeFilterPillsContainer.innerHTML = '';
        defaultTimeOptions.forEach(option => {
            const pillButton = document.createElement('button');
            pillButton.classList.add('infilter-time-pill');
            pillButton.textContent = option.label;
            pillButton.dataset.value = option.value;
            pillButton.setAttribute('role', 'radio');
            pillButton.setAttribute('aria-checked', 'false');
            pillButton.addEventListener('click', () => handleTimePillClick(pillButton));
            timeFilterPillsContainer.appendChild(pillButton);
        });
    }

    function handleTimePillClick(clickedPill) {
        timeFilterPillsContainer.querySelectorAll('.infilter-time-pill').forEach(pill => {
            pill.classList.remove('active');
            pill.setAttribute('aria-checked', 'false');
        });
        clickedPill.classList.add('active');
        clickedPill.setAttribute('aria-checked', 'true');
        selectedTimePillValue = parseInt(clickedPill.dataset.value, 10);
        customHoursInput.value = ''; // Clear custom input when a pill is clicked
        customHoursInput.dispatchEvent(new Event('input')); // Notify listeners custom value changed
    }

    customHoursInput.addEventListener('input', () => {
        if (customHoursInput.value !== "") {
            timeFilterPillsContainer.querySelectorAll('.infilter-time-pill').forEach(pill => {
                pill.classList.remove('active');
                pill.setAttribute('aria-checked', 'false');
            });
            selectedTimePillValue = null;
        }
    });

    // --- Time Filter Application Logic ---
    function applyTimeFilter() {
        const customInputValue = customHoursInput.value.trim();
        let hours = 0;

        if (customInputValue !== "") {
            const parsedCustomHours = parseInt(customInputValue, 10);
            if (!isNaN(parsedCustomHours) && parsedCustomHours >= 1 && parsedCustomHours <= 23) {
                hours = parsedCustomHours;
            } else {
                alert("Custom hours must be a number between 1 and 23.");
                customHoursInput.focus();
                return;
            }
        } else if (selectedTimePillValue !== null) {
            hours = selectedTimePillValue;
        } else {
            alert("Please select a time filter or enter custom hours.");
            return;
        }
        
        if (hours < 1 || hours > 23) { // Should be caught above, but as a safeguard
             alert("Selected time must be between 1 and 23 hours.");
             return;
        }

        const timeInSeconds = hours * 3600;

        // NOTE: The line that saved to chrome.storage.local has been removed.

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                try {
                    const currentUrl = new URL(tabs[0].url);
                    if (currentUrl.hostname.includes("linkedin.com") && (currentUrl.pathname.startsWith("/jobs/search") || currentUrl.pathname.startsWith("/jobs/collections"))) {
                        currentUrl.searchParams.set('f_TPR', `r${timeInSeconds}`);
                        currentUrl.searchParams.delete('start'); // Reset pagination
                        chrome.tabs.update(tabs[0].id, { url: currentUrl.toString() }, () => window.close());
                    } else {
                        alert("Time filter can only be applied on a LinkedIn job search page.");
                    }
                } catch (e) {
                    console.error("InFilter: Error processing URL for time filter:", e);
                    alert("Could not apply time filter due to a URL processing error.");
                }
            } else {
                alert("Please navigate to a LinkedIn job search results page to apply the time filter.");
            }
        });
    }
    applyTimeFilterButton.addEventListener('click', applyTimeFilter);


    // --- Company Blocklist Logic ---
    async function getBlocklist() {
        const result = await chrome.storage.local.get(['companyBlocklist']);
        return result.companyBlocklist || [];
    }

    async function saveBlocklist(blocklist) {
        await chrome.storage.local.set({ companyBlocklist: blocklist });
    }

    async function addCompanyToBlocklist() {
        const companyName = companyBlockInput.value.trim();
        if (!companyName) {
            companyBlockInput.focus();
            return;
        }

        const blocklist = await getBlocklist();
        if (!blocklist.some(item => item.toLowerCase() === companyName.toLowerCase())) {
            blocklist.push(companyName);
            await saveBlocklist(blocklist);
            renderBlockedCompaniesList(blocklist);
            companyBlockInput.value = ''; 
            notifyContentScript();
        } else {
            alert("Company already in blocklist.");
        }
        companyBlockInput.focus();
    }
    addCompanyButton.addEventListener('click', addCompanyToBlocklist);
    companyBlockInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addCompanyToBlocklist();
        }
    });


    async function removeCompanyFromBlocklist(companyNameToRemove) {
        let blocklist = await getBlocklist();
        blocklist = blocklist.filter(item => item.toLowerCase() !== companyNameToRemove.toLowerCase());
        await saveBlocklist(blocklist);
        renderBlockedCompaniesList(blocklist);
        notifyContentScript();
    }

    function renderBlockedCompaniesList(blocklist) {
        blockedCompaniesList.innerHTML = ''; // Clear current list
        if (blocklist.length === 0) {
            const emptyMessageDiv = document.createElement('div');
            emptyMessageDiv.className = 'empty-blocklist-message';
            emptyMessageDiv.textContent = 'No companies blocked yet.';
            blockedCompaniesList.appendChild(emptyMessageDiv);
            return;
        }

        blocklist.forEach(company => {
            const tagElement = document.createElement('li');
            tagElement.className = 'company-tag';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'company-name-tag';
            nameSpan.title = company;

            if (company.length > 18) {
                nameSpan.textContent = company.substring(0, 18) + "...";
            } else {
                nameSpan.textContent = company;
            }
            tagElement.appendChild(nameSpan);

            const removeIcon = document.createElement('button');
            removeIcon.className = 'remove-tag-icon';
            removeIcon.innerHTML = '&times;';
            removeIcon.setAttribute('aria-label', `Remove ${company} from blocklist`);
            
            removeIcon.addEventListener('click', () => removeCompanyFromBlocklist(company));
            tagElement.appendChild(removeIcon);
            
            blockedCompaniesList.appendChild(tagElement);
        });
    }

    function notifyContentScript() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                if (tabs[0].url && (tabs[0].url.includes("linkedin.com/jobs") || tabs[0].url.includes("linkedin.com/feed"))) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "UPDATE_BLOCKLIST" }, response => {
                        if (chrome.runtime.lastError) {
                            // Suppress error if content script isn't on the page
                        } else if (response) {
                            // console.log("JobFlow: Message response from content script:", response.status);
                        }
                    });
                }
            }
        });
    }

    // --- Info Tab ---
    if(supportButton) {
        supportButton.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://coff.ee/dipesh_koirala' }); 
        });
    }


    // --- Load settings and Initial Render ---
    async function loadInitialSettings() {
        renderTimeFilterPills();

        const blocklist = await getBlocklist();
        renderBlockedCompaniesList(blocklist);

        // This section sets the time filter state based on the current tab's URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError || !tabs || !tabs[0] || !tabs[0].url) {
                return; // Can't get URL, so show default UI
            }
            try {
                const url = new URL(tabs[0].url);
                const fTPR = url.searchParams.get('f_TPR');
                if (fTPR && fTPR.startsWith('r')) {
                    const seconds = parseInt(fTPR.substring(1), 10);
                    // Only update UI if filter is 24 hours (86400s) or less
                    if (!isNaN(seconds) && seconds > 0 && seconds <= 86400) {
                        const hours = Math.round(seconds / 3600);
                        const matchingPill = timeFilterPillsContainer.querySelector(`.infilter-time-pill[data-value="${hours}"]`);
                        
                        if (matchingPill) {
                            handleTimePillClick(matchingPill);
                        } else if (hours >= 1 && hours <= 23) {
                            customHoursInput.value = hours;
                            selectedTimePillValue = null; // Ensure no pill is considered active
                        }
                    }
                }
            } catch (e) {
                // Not a valid URL, ignore and show default UI
                console.error("InFilter: Could not parse URL to set initial state:", e);
            }
        });

        // Load and set the last active tab for persistence
        const data = await chrome.storage.local.get(['activeTabId']);
        const lastTabId = data.activeTabId || 'timeFilterTab'; // Default to 'timeFilterTab'
        setActiveTab(lastTabId);
    }

    loadInitialSettings();
});