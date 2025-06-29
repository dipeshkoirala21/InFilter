# Privacy Policy for InFilter

**Last Updated:** Jun 29, 2025

Thank you for using InFilter ("the Extension"), an advanced job filtering tool for LinkedIn. This Privacy Policy explains how the Extension handles information. Your privacy is critically important to us. The core principle of this extension is that **all operations are performed locally on your device.**

## 1. No Data Collection

InFilter is designed with privacy as its foremost priority. We **do not collect, store, transmit, or sell any of your personal data**. This includes, but is not limited to:
- Your name, email address, or other personal identifiers.
- Your LinkedIn account information or credentials.
- Your browsing activity or history outside of the direct functionality described below.

## 2. Information Handled Locally

The Extension interacts with data on your computer in the following ways, all of which occur exclusively within your browser:

*   **Company Blocklist:** When you add a company to the blocklist, the name of that company is saved locally on your device using the standard `chrome.storage.local` browser API. This list is never sent to us or any third party. It is used solely by the extension to hide matching job listings from your view.
*   **Website Content:** To perform its function, the Extension reads the text content of job listings on `linkedin.com` pages you visit. This is necessary to identify company names to match against your local blocklist. This reading and processing happens in real-time and entirely on your device. The content is not saved or transmitted.
*   **Web History (URLs):** To apply a custom time filter, the Extension reads the URL of the active LinkedIn job search page. This URL is used only to construct a new URL with the time filter applied. It is not stored, tracked, or logged.

## 3. How Information is Used

The information handled by the Extension is used exclusively for its core, user-facing features:
- To hide job postings from companies on your blocklist.
- To apply a specific hourly time filter to a LinkedIn job search.
- To remember which tab you last used within the popup for a better user experience.

## 4. No Third-Party Services

InFilter does not integrate with any third-party servers, analytics services, or advertising networks. All code, including fonts, is bundled within the extension package to prevent external network requests.

## 5. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in an updated version of the extension. We encourage you to review this policy periodically.

## 6. Contact Us

If you have any questions or concerns about this Privacy Policy or the Extension's practices, please open an issue on our [GitHub repository](https://github.com/dipeshkoirala21/InFilter/issues).
