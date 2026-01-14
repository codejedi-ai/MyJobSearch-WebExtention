# Copilot Instructions for MyJobSearch Web Extension

## Project Overview

A Chrome extension built with TypeScript and Preact that scrapes academic dates and job postings from university/job board websites, with planned job application automation capabilities.

**Architecture**: Content script (page scraping) → Background worker (processing/storage) → Popup UI (display)

## Build & Development

- **Build system**: Webpack (not Vite) - see [webpack.config.js](../../webpack.config.js)
- **Dev command**: `npm run dev` (watch mode, rebuilds on changes)
- **Build command**: `npm run build` (production)
- **Testing**: Reload extension in `chrome://extensions/` after builds; check DevTools console for logs
- **Prerequisite**: Create three PNG files in `public/icons/` (icon16.png, icon48.png, icon128.png) before first build

## Codebase Structure

### Core Modules
- **[src/background.ts](../../src/background.ts)** - Service worker; handles messaging between content scripts & popup; manages storage of scraped data
- **[src/content.ts](../../src/content.ts)** - Content script; runs on matched pages; extracts dates using three strategies (tables, sections, lists); deduplicates results
- **[src/popup/](../../src/popup/)** - Preact UI; displays stored dates; manages user interactions

### Type System
- **[src/types/index.ts](../../src/types/index.ts)** - Comprehensive interfaces for both academic dates and job data:
  - Date scraping: `ScrapedDate`, `ScrapedDateCollection`
  - Job scraping: `JobPosting`, `JobPlatform` (9 platforms: workday, waterlooworks, linkedin, indeed, etc.)
  - Messages: `ExtensionMessage` (union of all message types)
  - Storage: `StorageData` with nested records for dates, jobs, user profile

### Data Flow
1. Content script runs `scrapePage()` → finds dates using multiple strategies
2. Sends `SCRAPED_DATES` message to background worker
3. Background worker validates, deduplicates, extracts university name, stores in Chrome storage
4. Popup requests `GET_STORED_DATES` to display in UI

### Job Automation Foundation (In Progress)
- **[src/scrapers/base.ts](../../src/scrapers/base.ts)** - Abstract `BaseJobScraper` class with common methods:
  - `canScrape(url)` - Pattern matching for platform detection
  - `scrapeJob()` - Abstract; implemented per platform
  - Utilities: `cleanText()`, `extractSkills()`, `extractKeywords()`, `parseSalary()`
- **[src/scrapers/workday.ts](../../src/scrapers/workday.ts)** - Workday implementation (reference for other scrapers)
- **Roadmap**: Add scrapers for LinkedIn, Indeed, Greenhouse, Lever, BambooHR, Dayforce, WaterlooWorks, and generic fallback

## Key Patterns & Conventions

### Message Pattern
All communication uses typed message objects extending `BaseMessage`:
```typescript
chrome.runtime.sendMessage({
  type: 'SCRAPED_DATES',
  data: dates,
  sourceUrl: window.location.href,
  timestamp: new Date().toISOString(),
});
```

### Date Extraction Strategy
Content script tries multiple extraction methods in sequence (tables → sections → lists) and deduplicates by event+date combination. See content.ts lines 46-98 for implementation.

### Storage Keys
Dates stored by `sourceUrl` as key; jobs stored by `jobId` (platform-hash-timestamp pattern). Always use `StorageData` interface for type safety.

### Logging
Use `console.log()` for debug output (visible in extension DevTools). Include context: `console.log('Processing N items from URL:', url);`

### Skill Extraction
Base scraper has regex patterns for languages, frameworks, and tech stack. Add new patterns to `skillPatterns` array in `extractSkills()` method.

## Critical Developer Workflows

### Adding a New Job Platform Scraper
1. Create `src/scrapers/[platform].ts` extending `BaseJobScraper`
2. Set `platform` and `urlPattern` properties
3. Implement `scrapeJob()` method following Workday pattern
4. Test with actual job postings from that platform
5. Register in a scraper registry (to be created in Phase 1)

### Testing Date Scraping
1. Run `npm run dev`
2. Visit a university important-dates page (e.g., uwaterloo.ca/current-graduate-students/important-dates)
3. Open DevTools (F12); check console for logs
4. Click extension icon to view popup and see stored dates

### Testing Job Scraping (Future)
Job scraping is foundation-only; requires auto-fill and auto-apply systems. See [JOB-AUTOMATION-PLAN.md](../../JOB-AUTOMATION-PLAN.md) for full roadmap.

## Integration Points & Cross-Component Communication

### Content Script → Background Worker
- `SCRAPED_DATES`: New dates found; background validates and stores
- Background responds with `{ success: boolean }`

### Popup → Background Worker
- `GET_STORED_DATES`: Retrieve dates for display (optionally scoped to URL)
- Background responds with `STORED_DATES` message including timestamp
- `CLEAR_STORAGE`: Remove stored dates for a URL or all

### Chrome APIs Used
- `chrome.runtime.onMessage` - Listen for messages
- `chrome.runtime.sendMessage` - Send to background worker
- `chrome.storage.local` - Persist data across sessions
- `chrome.tabs.query` / `chrome.scripting.executeScript` - (Future) For auto-apply automation

## Important Conventions & Warnings

- **Date Format**: Always use ISO 8601 (YYYY-MM-DD) for comparisons; parse with `parseDate()` utility
- **Deduplication**: Content script deduplicates; background also validates to ensure data integrity
- **URL Matching**: Manifest.json defines which pages trigger content script (important-dates, academic-calendar, registrar paths on .edu, .ac.uk, uwaterloo.ca domains)
- **Async Handling**: Background worker's `onMessage` listener must `return true` to keep channel open for async responses
- **Job Automation Legal Risk**: Auto-applying violates ToS for most platforms (Workday, LinkedIn). Form-assist mode (pre-fill + user clicks submit) is safer. See JOB-AUTOMATION-PLAN.md for details.

## Useful Files for Context

- [QUICKSTART.md](../../QUICKSTART.md) - Setup and testing in 5 steps
- [README.md](../../README.md) - Feature overview and installation guide
- [JOB-AUTOMATION-PLAN.md](../../JOB-AUTOMATION-PLAN.md) - Phase-by-phase roadmap, legal warnings, implementation strategy
