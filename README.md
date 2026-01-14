# MyJobSearch - Academic Date Scraper

A Chrome extension that automatically scrapes academic and job-related dates from university websites and converts them to structured JSON format.

## Features

- **Automatic Scraping**: Extracts important dates when you visit university pages
- **Smart Detection**: Uses multiple strategies to identify dates (tables, sections, lists)
- **Category Classification**: Automatically categorizes events (registration, deadline, exam, academic, closure)
- **Persistent Storage**: Stores scraped data in Chrome local storage
- **Beautiful UI**: Preact-based popup to view and manage scraped dates
- **JSON Export**: Export all scraped data as JSON for further processing
- **Background Processing**: Runs automatically without user interaction

## Supported Pages

The extension automatically activates on pages containing:
- `/important-dates`
- `/academic-calendar`
- `/registrar`

Supported domains:
- `uwaterloo.ca`
- `*.edu` (all educational institutions)
- `*.ac.uk` (UK universities)

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Chrome or Chromium-based browser

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MyJobSearch-WebExtention
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create extension icons** (required)

   Create three PNG files in `public/icons/`:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

   You can use any image editor or online tool like [Favicon Generator](https://realfavicongenerator.net/).

   **Quick placeholder generation** (if you have ImageMagick):
   ```bash
   convert -size 16x16 xc:#667eea public/icons/icon16.png
   convert -size 48x48 xc:#667eea public/icons/icon48.png
   convert -size 128x128 xc:#667eea public/icons/icon128.png
   ```

4. **Build the extension**
   ```bash
   npm run build
   ```

5. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from this project
   - The extension should now appear in your extensions list

## Documentation

Full documentation is available in the [`docs/`](docs/) folder:

- **[QUICKSTART.md](docs/QUICKSTART.md)** - Get up and running in 5 minutes
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed architecture and coding patterns for AI agents
- **[JOB-AUTOMATION-PLAN.md](docs/JOB-AUTOMATION-PLAN.md)** - Roadmap for job automation features
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contributing guidelines and development practices

## Development

### Available Scripts

```bash
# Build for production
npm run build

# Build in development mode with watch
npm run dev

# Clean build directory
npm run clean
```

### Development Workflow

1. **Start development build with watch mode**
   ```bash
   npm run dev
   ```

2. **Make code changes** in `src/`

3. **Reload extension in Chrome**
   - Go to `chrome://extensions/`
   - Click the reload icon on the MyJobSearch extension
   - Or use the "Reload" button in Chrome DevTools

4. **View console logs**
   - Background worker logs: `chrome://extensions/` → Click "service worker" under the extension
   - Content script logs: Open DevTools on any matched page (F12)
   - Popup logs: Right-click extension icon → "Inspect popup"

## Usage

### Automatic Scraping

1. Visit a university's important dates page (e.g., https://uwaterloo.ca/current-graduate-students/important-dates)
2. The extension automatically scrapes dates from the page
3. A notification appears in the console (check DevTools)
4. Data is stored in Chrome local storage

### Viewing Scraped Data

1. Click the extension icon in Chrome toolbar
2. View all scraped dates organized by university
3. Switch between different universities using tabs
4. See event details, dates, terms, and categories

### Exporting Data

1. Click the extension icon
2. Click "Export JSON" button
3. A JSON file downloads with all scraped data
4. Use this data in your job search tools or calendar applications

### Clearing Data

1. Click the extension icon
2. Click "Clear All" button to remove all scraped data
3. Confirm the action

## Project Structure

```
MyJobSearch-WebExtention/
├── public/
│   ├── manifest.json          # Chrome extension manifest (v3)
│   └── icons/                 # Extension icons (16, 48, 128px)
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon128.png
│       └── README.md
├── src/
│   ├── background.ts          # Background service worker
│   ├── content.ts             # Content script (scraping logic)
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── dateParser.ts      # Date parsing utilities
│   │   └── storage.ts         # Chrome storage wrappers
│   ├── popup/
│   │   ├── index.tsx          # Popup entry point
│   │   ├── PopupApp.tsx       # Main popup component
│   │   ├── popup.html         # Popup HTML template
│   │   └── style.css          # Popup styles
│   └── style.css              # Global styles
├── dist/                      # Build output (created by webpack)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.js
│   ├── popup.html
│   └── icons/
├── webpack.config.js          # Webpack configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Technical Details

### Architecture

**Manifest V3**: Uses the latest Chrome extension manifest version

**Build System**: Webpack with TypeScript and Preact support

**Storage**: Chrome local storage (10MB limit)

**Framework**: Preact for popup UI (lightweight React alternative)

### Scraping Strategies

The content script uses three strategies to extract dates:

1. **Table-based extraction**
   - Identifies header rows to find date/event columns
   - Parses table rows for structured data
   - Fallback: scans all cells for date patterns

2. **Section-based extraction**
   - Looks for term headings (Winter 2025, Fall 2024)
   - Extracts dates from heading's sibling elements
   - Associates dates with terms

3. **List-based extraction**
   - Scans `<ul>` and `<ol>` elements
   - Extracts dates from list items
   - Inherits term from parent context

### Date Parsing

Supports multiple date formats:
- `January 15, 2025` or `Jan 15, 2025`
- `15 January 2025`
- `01/15/2025` or `01-15-2025`
- `2025-01-15` (ISO format)

### Event Categorization

Automatic categorization based on keywords:
- **Registration**: "registration", "enrol", "enroll"
- **Deadline**: "deadline", "due", "last day"
- **Exam**: "exam", "final", "test"
- **Academic**: "term", "semester", "class"
- **Closure**: "holiday", "closure", "closed"
- **Other**: Default category

### Data Storage Schema

```json
{
  "scraped_dates": {
    "uwaterloo.ca/important-dates": {
      "sourceUrl": "https://uwaterloo.ca/...",
      "university": "University of Waterloo",
      "scrapedAt": "2026-01-13T22:00:00Z",
      "dates": [
        {
          "event": "Course enrolment begins",
          "date": "2025-01-15T00:00:00Z",
          "term": "Winter 2025",
          "category": "registration",
          "deadline": false,
          "sourceUrl": "...",
          "scrapedAt": "..."
        }
      ],
      "version": 1
    }
  }
}
```

## Troubleshooting

### Extension not loading
- Ensure all icon files exist in `public/icons/`
- Check `dist/` folder exists and contains built files
- Look for errors in `chrome://extensions/` page

### No dates being scraped
- Check DevTools console for errors (F12)
- Verify the page URL matches patterns in manifest.json
- Ensure page has loaded completely before scraping
- Check background worker console: `chrome://extensions/` → "service worker"

### Build errors
- Delete `node_modules/` and `dist/` folders
- Run `npm install` again
- Run `npm run clean` then `npm run build`

### TypeScript errors
- Ensure `@types/chrome` is installed: `npm install --save-dev @types/chrome`
- Check `tsconfig.json` settings
- Run `npx tsc --noEmit` to check for type errors

## Browser Compatibility

- Google Chrome (v88+)
- Microsoft Edge (v88+)
- Brave Browser
- Any Chromium-based browser supporting Manifest V3

## Permissions Explained

- **storage**: Store scraped dates in local storage
- **activeTab**: Access current tab's content when extension is clicked
- **scripting**: Inject content script to scrape page data
- **host_permissions**: Access university websites to scrape data

## Future Enhancements

- [ ] Export to iCal/Google Calendar format
- [ ] Notifications for approaching deadlines
- [ ] Support for more university websites
- [ ] Machine learning for improved date extraction
- [ ] Options page for user preferences
- [ ] Sync across devices with Chrome storage sync
- [ ] Filter and search scraped dates
- [ ] Dark mode for popup UI

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with Preact, TypeScript, and Webpack
