

try {
    let companyBlocklist = []; // Global scope
    let applyBlocklistDebounceTimer;
    let observer; // Define observer at a higher scope
    let currentObserverTargetNode = null; // To store the node being observed
    let lastProcessedHref = ''; // To detect URL changes for filter applications
    let periodicCheckIntervalId = null; // To store the interval ID

    const MAX_OBSERVER_SETUP_ATTEMPTS = 10;
    const OBSERVER_SETUP_RETRY_DELAY = 1500;
    const INITIAL_OBSERVER_SETUP_DELAY = 2000;
    const URL_CHECK_INTERVAL = 1000; // ms

    async function loadBlocklist() {
        try {
            const result = await chrome.storage.local.get(['companyBlocklist']);
            companyBlocklist = (result.companyBlocklist || []).map(name => String(name).trim().toLowerCase()).filter(name => name.length > 0);
        } catch (error) {
            companyBlocklist = [];
        }
    }

    function applyCompanyBlocklist(callSource = "unknown") {
        if (!Array.isArray(companyBlocklist)) {
            console.warn("LJF: companyBlocklist is not an array. Defaulting to empty.");
            companyBlocklist = [];
        }

        // Unhide all previously hidden LIs by this script
        document.querySelectorAll('li[data-infilter-hidden="true"]').forEach(li => {
            li.style.removeProperty('display');
            li.removeAttribute('data-infilter-hidden');
        });

        let hiddenCount = 0;

        if (companyBlocklist.length > 0) {
            const allUlElements = document.querySelectorAll('ul');

            allUlElements.forEach(ul => {
                for (const li of ul.children) {
                    if (li.tagName === 'LI' && !li.hasAttribute('data-infilter-hidden')) {
                        const liText = li.textContent?.trim().toLowerCase();
                        if (!liText) {
                            continue;
                        }
                        for (const blockedCompany of companyBlocklist) {
                            if (liText.includes(blockedCompany)) {
                                li.style.setProperty('display', 'none', 'important');
                                li.setAttribute('data-infilter-hidden', 'true');
                                hiddenCount++;
                                break;
                            }
                        }
                    }
                }
            });
        }
        
        // --- BADGE COUNTER LOGIC ---
        let shouldSendUpdate = true;
        // If the count is 0, we must be careful not to reset the badge during a page load.
        if (hiddenCount === 0) {
            // Check if a known LinkedIn loading spinner is visible on the page.
            const loadingSpinnerSelectors = [
                '.jobs-search-results-list__loading',
                '.artdeco-spinner',
                '[role="progressbar"]'
            ];
            if (document.querySelector(loadingSpinnerSelectors.join(','))) {
                // A spinner is active, so this is likely a page transition.
                // Suppress the "0" update to prevent the badge from blinking.
                shouldSendUpdate = false;
            }
        }

        if (shouldSendUpdate) {
            try {
                chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count: hiddenCount });
            } catch (e) {
                // This error ("context invalidated") is expected during page navigation and can be safely ignored.
                if (e.message && !e.message.includes("Extension context invalidated")) {
                    console.error("InFilter: Error sending badge update:", e);
                }
            }
        }
    }


    function updateLinkedInTimeFilterDisplay() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const fTPR = urlParams.get('f_TPR');
            if (!fTPR || !fTPR.startsWith('r')) return;
    
            const seconds = parseInt(fTPR.substring(1), 10);
            if (isNaN(seconds) || seconds <= 0) return;
    
            const hours = Math.round(seconds / 3600);
            const isCustomHourlyFilter = hours > 0 && hours < 24;
    
            if (!isCustomHourlyFilter) {
                return; // Not a custom hourly filter we need to manage.
            }
    
            const displayHoursText = (hours === 1) ? "Past hour" : `Past ${hours} hours`;
    
            const topPillSelectors = [
                'button.search-reusables__filter-pill--active[id*="date-posted"]',
                'button.artdeco-pill--selected[id*="date-posted"]',
                'button#searchFilter_timePostedRange', 
                'button[data-control-name*="date_posted"]'
            ];
    
            for (const selector of topPillSelectors) {
                const element = document.querySelector(selector);
                 if (element) {
                    const textHolder = element.querySelector('.artdeco-pill__text') || element;
                    const currentText = (textHolder.innerText || textHolder.textContent || "").trim();
                    if (currentText !== displayHoursText) {
                         textHolder.textContent = displayHoursText;
                    }
                    break; 
                }
            }
    
            const inputId = `timePostedRange-r${seconds}`;
            const radioInput = document.getElementById(inputId);
    
            if (radioInput) {
                const listItem = radioInput.closest('li');
                if (listItem) {
                    const textSpanSelectors = [
                        'label span.t-14.t-black--light.t-normal',
                        'label span.artdeco-facet-filter-value-label__text'
                    ];
            
                    for (const selector of textSpanSelectors) {
                        const textSpan = listItem.querySelector(selector);
                        if (textSpan && textSpan.textContent.trim() !== displayHoursText) {
                            textSpan.textContent = displayHoursText;
                            break;
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error("LJF: Error in updateLinkedInTimeFilterDisplay():", error);
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "UPDATE_BLOCKLIST") {
            loadBlocklist().then(() => {
                applyCompanyBlocklist("message_from_popup");
                if (sendResponse) sendResponse({ status: "Blocklist updated and applied from message." });
            }).catch(e => {
                console.error("LJF: Error reloading/applying blocklist on message:", e);
                if (sendResponse) sendResponse({ status: "Error processing blocklist update.", error: e.message });
            });
            return true; 
        }
    });

    observer = new MutationObserver((mutationsList, obs) => {
        let hasRelevantChanges = false;
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                 for (const addedNode of mutation.addedNodes) {
                    if (addedNode.nodeType === Node.ELEMENT_NODE) {
                        if (addedNode.matches && (addedNode.matches('ul, li') || addedNode.querySelector('ul, li'))) {
                             hasRelevantChanges = true;
                             break;
                        }
                    }
                }
            } else if (mutation.type === 'characterData') { 
                const textNodeContainingElement = mutation.target.parentElement;
                if (textNodeContainingElement) {
                    const closestLi = textNodeContainingElement.closest('li');
                    if (closestLi && closestLi.parentElement && closestLi.parentElement.tagName === 'UL') {
                        hasRelevantChanges = true;
                    }
                }
            }
            if (hasRelevantChanges) break;
        }

        if (hasRelevantChanges) {
            clearTimeout(applyBlocklistDebounceTimer);
            applyBlocklistDebounceTimer = setTimeout(() => {
                applyCompanyBlocklist("MutationObserver_Debounced");
                updateLinkedInTimeFilterDisplay();

                if (currentObserverTargetNode && !currentObserverTargetNode.isConnected) {
                    if(observer) observer.disconnect();
                    currentObserverTargetNode = null;
                    attemptToSetupObserver(1);
                }
            }, 1000); 
        }
    });

    function attemptToSetupObserver(attempt = 1) {
        if (currentObserverTargetNode && currentObserverTargetNode.isConnected) {
            try {
                observer.observe(currentObserverTargetNode, { childList: true, subtree: true, characterData: true }); 
                return;
            } catch(e) {
                currentObserverTargetNode = null;
            }
        }

        let targetNode = null;
        const prioritizedSelectors = [
            'main#main, main[role="main"]',
            'div.scaffold-layout__main', 
            'div.scaffold-finite-scroll__content', 
            'div#content-main',
            'body' 
        ];

        for (const selector of prioritizedSelectors) {
            targetNode = document.querySelector(selector);
            if (targetNode) {
                break;
            }
        }

        if (targetNode) {
            currentObserverTargetNode = targetNode;
            observer.observe(currentObserverTargetNode, { childList: true, subtree: true, characterData: true });
        } else {
            if (attempt < MAX_OBSERVER_SETUP_ATTEMPTS) {
                setTimeout(() => attemptToSetupObserver(attempt + 1), OBSERVER_SETUP_RETRY_DELAY);
            } else {
                currentObserverTargetNode = document.documentElement; 
                observer.observe(currentObserverTargetNode, { childList: true, subtree: true, characterData: true });
            }
        }
        lastProcessedHref = window.location.href;
    }

    function handlePotentialFilterOrPageChange(source = "unknown_source") {
        if (window.location.href !== lastProcessedHref) {
            lastProcessedHref = window.location.href;

            setTimeout(() => {
                applyCompanyBlocklist(`url_change_delayed_${source}`);
                updateLinkedInTimeFilterDisplay();

                if (observer) {
                    observer.disconnect();
                }
                currentObserverTargetNode = null;
                attemptToSetupObserver(1);
            }, 750); 
        } else {
             if (source === "periodic_check") {
                applyCompanyBlocklist("periodic_reapply");
                updateLinkedInTimeFilterDisplay();
             }
        }
    }

    async function init() {
        try {
            await loadBlocklist();
            lastProcessedHref = window.location.href;

            applyCompanyBlocklist("init_immediate");
            updateLinkedInTimeFilterDisplay();

            setTimeout(() => {
                attemptToSetupObserver();
            }, INITIAL_OBSERVER_SETUP_DELAY);

            setTimeout(() => {
                applyCompanyBlocklist("init_extended_fallback");
                updateLinkedInTimeFilterDisplay();
            }, INITIAL_OBSERVER_SETUP_DELAY * 3.5); 

            if (periodicCheckIntervalId) clearInterval(periodicCheckIntervalId);
            periodicCheckIntervalId = setInterval(() => handlePotentialFilterOrPageChange("periodic_check"), URL_CHECK_INTERVAL);

        } catch (e) {
            console.error("LJF: Error INSIDE init():", e);
        }
    }

    (function() {
        const runInit = () => {
            init();
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", runInit, { once: true });
        } else {
            runInit();
        }
    })();

} catch (e) {
    console.error("LJF: Global error in content.js setup:", e);
}
