# Quick Start Guide

Get the extension running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Icons

Create three simple placeholder icons:

**Option A: Use any 3 PNG images**
- Copy 3 PNG files to `public/icons/`
- Rename them: `icon16.png`, `icon48.png`, `icon128.png`

**Option B: Use ImageMagick (if installed)**
```bash
convert -size 16x16 xc:#667eea public/icons/icon16.png
convert -size 48x48 xc:#667eea public/icons/icon48.png
convert -size 128x128 xc:#667eea public/icons/icon128.png
```

**Option C: Download from online tool**
- Visit [Favicon Generator](https://realfavicongenerator.net/)
- Upload any image
- Download and extract to `public/icons/`

## Step 3: Build

```bash
npm run build
```

## Step 4: Load in Chrome

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist/` folder
6. Done!

## Step 5: Test It

1. Visit: https://uwaterloo.ca/current-graduate-students/important-dates
2. Open DevTools (F12) and check console
3. Click the extension icon to view scraped dates
4. The extension will also save page snapshots (HTML + JSON) to your Downloads folder for debugging

## Development Mode

For active development with auto-rebuild:

```bash
npm run dev
```

Then reload the extension in Chrome after each change:
- Go to `chrome://extensions/`
- Click reload icon on your extension

## Troubleshooting

**Extension won't load?**
- Make sure the 3 icon files exist in `public/icons/`
- Check for errors on `chrome://extensions/` page

**No dates scraped?**
- Open DevTools (F12) on the university page
- Check console for errors
- Verify the URL contains "important-dates" or "academic-calendar"

**Build fails?**
```bash
npm run clean
rm -rf node_modules
npm install
npm run build
```

---

For detailed documentation, see [README.md](../README.md)
