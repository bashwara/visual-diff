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

1. Extract the related cookies from your primary browser. 
    - You can use the [EditThisCookie (V3)](https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol) extension to easily extract the cookies in the required format.

2. Include the cookies in the `/server/backstop_data/engine_scripts/cookies.json` file.