# MyJobSearch Extension - Hello World

A simple Chrome extension that displays "Hello World".

## Installation

1. Clone the repository
2. Run `npm install`
3. Create three PNG files in `public/icons/`:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)
4. Run `npm run build`
5. Open Chrome and go to `chrome://extensions/`
6. Enable "Developer mode"
7. Click "Load unpacked" and select the `dist/` folder

## Development

```bash
# Build for production
npm run build

# Build in development mode with watch
npm run dev
```

## What It Does

This extension is a basic hello world implementation that:
- Displays "Hello World" in the popup UI
- Logs "Hello World" messages to the browser console

That's it! All other functionality has been removed.
