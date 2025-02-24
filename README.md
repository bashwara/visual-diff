# visual-diff

A simple tool leveraging on [BackstopJS](https://github.com/garris/BackstopJS) to compare two webpages for visual regression testing.

## Setup

### Prerequisites

- nodejs

### Local run

1. Install dependencies for both server and client.
```
npm install
```

2. Run the server.
```
node server.js
```

3. Run the client.
```
npm run dev
```

#### To use with web pages where authorization is required:

1. Open Chrome and navigate to `chrome://extensions/`.

2. Enable `Developer mode` by toggling the switch in the top-right corner.

3. Click the "Load unpacked" button

4. Select the `/utils/cookie-exporter` directory.

5. The extension should now appear in your extensions list.

6. Navigate to the website you want to extract cookies from.

7. Click the Cookie Exporter extension icon in your browser toolbar.

8. Choose whether to export cookies from:
    - Current tab only (cookies for the current domain)
    - All cookies (all cookies in your browser)

9. Click the "Export Cookies" button.

10. Choose where to save the JSON file when prompted.

11. Copy the contents of the generated file to the `/server/backstop_data/engine_scripts/cookies.json` file.