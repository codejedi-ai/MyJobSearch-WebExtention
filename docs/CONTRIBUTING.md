# Contributing to MyJobSearch

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

See [QUICKSTART.md](QUICKSTART.md) for initial setup instructions.

## Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types for all new code
   - Test thoroughly in Chrome

3. **Test your changes**
   ```bash
   # Build in development mode
   npm run dev

   # Load extension in Chrome
   # Test on multiple university websites
   # Check console for errors
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add support for UK university websites
fix: handle malformed dates in content script
docs: update installation instructions
refactor: improve date parsing performance
```

## Code Style

- **TypeScript**: Use strict type checking
- **Formatting**: 2-space indentation (tabs)
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Comments**: Add JSDoc comments for public functions

## Project Structure

When adding new features, follow this structure:

- **Background worker logic**: `src/background.ts`
- **Scraping logic**: `src/content.ts`
- **UI components**: `src/popup/`
- **Type definitions**: `src/types/index.ts`
- **Utilities**: `src/utils/`

## Adding New Features

### Adding a New Scraping Strategy

1. Add extraction function in `src/content.ts`:
   ```typescript
   function extractFromNewPattern(): ScrapedDate[] {
     // Your implementation
   }
   ```

2. Call it in `scrapePage()`:
   ```typescript
   function scrapePage(): ScrapedDate[] {
     const dates: ScrapedDate[] = [];
     dates.push(...extractFromTables());
     dates.push(...extractFromSections());
     dates.push(...extractFromLists());
     dates.push(...extractFromNewPattern()); // Add here
     return deduplicateDates(dates);
   }
   ```

### Adding a New University

1. Update `public/manifest.json` to include URL patterns:
   ```json
   "content_scripts": [{
     "matches": [
       "https://newuniversity.edu/*/dates*"
     ]
   }]
   ```

2. Add university name detection in `src/background.ts`:
   ```typescript
   function extractUniversityName(url: string): string | undefined {
     if (hostname.includes('newuniversity.edu')) {
       return 'New University Name';
     }
   }
   ```

### Adding a New Export Format

1. Add export function in `src/popup/PopupApp.tsx`:
   ```typescript
   const exportToICalendar = () => {
     // Convert to iCal format
     const icalData = convertToICal(storedDates);
     downloadFile(icalData, 'academic-dates.ics', 'text/calendar');
   };
   ```

2. Add button to UI:
   ```tsx
   <button onClick={exportToICalendar} class="btn btn-primary">
     Export to Calendar
   </button>
   ```

## Testing Guidelines

### Manual Testing

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Load in Chrome**
   - Go to `chrome://extensions/`
   - Reload the extension

3. **Test scenarios**
   - [ ] Visit university important dates page
   - [ ] Verify dates are scraped
   - [ ] Check popup displays data correctly
   - [ ] Test JSON export
   - [ ] Confirm HTML + JSON snapshots download to your Downloads folder
   - [ ] Test clear all functionality
   - [ ] Test with multiple universities

4. **Check console logs**
   - Background worker: `chrome://extensions/` → "service worker"
   - Content script: F12 on any page
   - Popup: Right-click extension icon → "Inspect popup"

### Edge Cases to Test

- Pages with no dates
- Pages with malformed dates
- Pages with JavaScript-loaded content
- Very large numbers of dates (100+)
- Multiple date formats on same page
- Non-English date formats

## Debugging

### Enable verbose logging

Add `console.log()` statements:

```typescript
// In content.ts
console.log('Scraping started:', window.location.href);
console.log('Found dates:', dates);

// In background.ts
console.log('Received message:', message);
console.log('Saving to storage:', collection);
```

### View Chrome storage

In DevTools console:
```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

### Clear storage for testing

```javascript
chrome.storage.local.clear();
```

## Performance Considerations

- Keep content script lightweight (runs on every matched page)
- Avoid blocking the main thread
- Use `requestIdleCallback` for heavy processing
- Limit DOM queries

## Security

- Never use `eval()` or `Function()` constructor
- Validate all scraped data
- Sanitize before storing
- Don't inject scripts from external sources
- Follow Chrome Web Store policies

## Documentation

When adding features:

1. Update README.md if user-facing
2. Add JSDoc comments to functions
3. Update TypeScript types
4. Add examples if complex

## Questions?

Open an issue or discussion on GitHub!

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
