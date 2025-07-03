# InFilter: Advanced Job Filter for LinkedIn

![InFilter Logo](icons/icon128.png)

**Supercharge your LinkedIn job search with precise time filters and a powerful company blocker.**

LinkedIn's default search only allows filtering jobs posted in the "Past 24 hours," making it hard to find the very latest opportunities. InFilter is a lightweight but powerful browser extension that breaks this limitation, giving you precise control over your job search. It seamlessly integrates into the LinkedIn UI, allowing you to filter job postings by any hour (1-23) and hide job listings from companies you're not interested in.

---

## Key Features

-   **🎯 Custom Hourly Time Filters:** Break free from LinkedIn's default "Past 24 hours" filter. Find the freshest job listings by filtering down to the exact hour.
-   **🚫 Powerful Company Blocker:** Clean up your search results by adding unwanted companies to a personal blocklist. InFilter will automatically hide jobs from these companies across LinkedIn.
-   **✨ Seamless UI Integration:** InFilter feels like a native part of LinkedIn. Custom time filters and blocked companies are reflected directly on the search results page.
-   **🔒 Privacy-Focused & Stateless:** Your privacy is paramount. InFilter runs entirely locally in your browser. It **does not collect, store, or transmit any user data**. The time filter is stateless, meaning it reads the current URL to set its state, not from stored settings.
-   **🧠 Smart & Persistent UI:** The popup remembers the last tab you used (Time Filter or Company Blocker) for a faster workflow.

---

## Installation

### From Your Browser's Web Store

[*(Link)*:](https://chromewebstore.google.com/detail/keomcieggcchjkicfgokoccgbhgnnmhf?utm_source=item-share-cb)

1.  Visit the InFilter page on the **Chrome Web Store** or **Microsoft Edge Add-ons**.
2.  Click **"Add to Chrome"** or **"Get"**.
3.  Once installed, the InFilter icon will appear in your browser's toolbar.
4.  **Pin for easy access!** Click the puzzle piece icon (🧩) in your toolbar, find InFilter, and click the pin icon next to it.

### For Developers: Manual Installation

1.  **Download:** Clone this repository or download it as a ZIP file and unzip it.
2.  **Open Chrome/Edge Extensions:** Open Google Chrome and navigate to `chrome://extensions` or `edge://extensions/` for Microsoft Edge.
3.  **Enable Developer Mode:** Turn on the "Developer mode" toggle in the top-right corner in Chrome. Left panel in Microsoft Edge.
4.  **Load the Extension:** Click the "Load unpacked" button and select the unzipped extension directory.

---

## How to Use

### Applying a Custom Time Filter

1.  Navigate to a LinkedIn job search results page.
2.  Click the **InFilter icon** in your browser toolbar to open the popup.
3.  In the **Time Filter** tab:
    -   Click a preset pill (e.g., `5hr`, `22hr`).
    -   OR type a number from 1-23 in the "custom hours" input field.
4.  Click **Apply Filter**. The page will reload with the precise time filter applied, and the filter pill on LinkedIn will update to reflect your choice (e.g., "Past 22 hours").

### Blocking Companies

1.  Click the **InFilter icon** to open the popup.
2.  Go to the **Company Blocker** tab.
3.  Type the name of a company you want to block into the input field.
4.  Click **Add** or press `Enter`.
5.  The company will be added to your blocklist, and any matching job listings will be hidden from view automatically.
6.  To remove a company, simply click the small `x` icon on the company's tag in the blocklist.

---

## Privacy Policy

InFilter is built with privacy as a core principle.

-   **No Data Collection:** The extension does not collect, store, read, or transmit any of your personal data, LinkedIn account information, or browsing activity.
-   **Local Operation:** All functionalities, including your custom company blocklist, are stored locally on your computer using the standard `chrome.storage.local` API. This data never leaves your machine and is not accessible by the developers or any third party.

---

## Disclaimer

InFilter is an independent project and is not affiliated with, sponsored, or endorsed by LinkedIn Corporation.

---

## Support the Project

If you find this extension helpful, consider supporting its development. Thank you!

[☕ Buy me a coffee](https://coff.ee/dipesh_koirala)