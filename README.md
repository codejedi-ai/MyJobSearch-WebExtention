# Hello World Chrome Extension

A basic starter template for a Chrome extension using TypeScript, Preact, and Webpack.

## Features

- **Popup UI**: Built with Preact.
- **Content Script**: Logs "Hello World" to the page console.
- **Background Script**: Minimal background service worker.
- **TypeScript**: Type-safe development.
- **Webpack**: Bundled for Chrome.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   # Development mode (with watch)
   npm run dev

   # Production mode
   npm run build
   ```

3. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder in this project

## Structure

- `src/popup/`: The popup UI entry point and components.
- `src/content.ts`: Script that runs in the context of web pages.
- `src/background.ts`: The extension's service worker.
- `public/manifest.json`: Extension configuration.
