import { ScrapedDate } from './types';
import { parseDate, extractTermFromText, categorizeEvent, isDeadline, extractEventText, extractDatesFromText } from './utils/dateParser';

console.log('Content script loaded on:', window.location.href);

// Run scraping when page is fully loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', runScraper);
} else {
	runScraper();
}

function runScraper(): void {
	console.log('Starting date scraping...');
	const dates = scrapePage();
	console.log(`Found ${dates.length} dates`);

	if (dates.length > 0) {
		// Send to background worker
		chrome.runtime.sendMessage({
			type: 'SCRAPED_DATES',
			data: dates,
			sourceUrl: window.location.href,
			timestamp: new Date().toISOString(),
		}, (response) => {
			if (response && response.success) {
				console.log('Successfully sent dates to background worker');
			} else {
				console.error('Failed to send dates to background worker:', response);
			}
		});
	} else {
		console.warn('No dates found on this page');
	}
}

function scrapePage(): ScrapedDate[] {
	const dates: ScrapedDate[] = [];

	// Strategy 1: Extract from tables
	dates.push(...extractFromTables());

	// Strategy 2: Extract from sections with headings
	dates.push(...extractFromSections());

	// Strategy 3: Extract from list items
	dates.push(...extractFromLists());

	// Deduplicate dates based on event + date combination
	const uniqueDates = deduplicateDates(dates);

	return uniqueDates;
}

function extractFromTables(): ScrapedDate[] {
	const results: ScrapedDate[] = [];
	const tables = document.querySelectorAll('table');

	tables.forEach((table) => {
		const rows = Array.from(table.querySelectorAll('tr'));

		// Try to find header row
		const headerRow = rows.find((r) => r.querySelector('th'));
		const headers = headerRow
			? Array.from(headerRow.querySelectorAll('th')).map((th) => th.textContent?.toLowerCase() || '')
			: [];

		// Find date and event columns
		const dateColIndex = headers.findIndex((h) => h.includes('date') || h.includes('when'));
		const eventColIndex = headers.findIndex(
			(h) => h.includes('event') || h.includes('description') || h.includes('item') || h.includes('what')
		);

		// If we found column indices, use them
		if (dateColIndex >= 0 && eventColIndex >= 0) {
			rows.forEach((row) => {
				const cells = Array.from(row.querySelectorAll('td'));
				if (cells.length >= 2) {
					const dateText = cells[dateColIndex]?.textContent;
					const eventText = cells[eventColIndex]?.textContent;

					if (dateText && eventText) {
						const parsed = parseDate(dateText);
						if (parsed) {
							results.push({
								event: eventText.trim(),
								date: parsed.toISOString(),
								category: categorizeEvent(eventText),
								deadline: isDeadline(eventText),
								sourceUrl: window.location.href,
								scrapedAt: new Date().toISOString(),
							});
						}
					}
				}
			});
		} else {
			// Fallback: try each cell for dates
			rows.forEach((row) => {
				const cells = Array.from(row.querySelectorAll('td'));
				if (cells.length >= 2) {
					cells.forEach((cell, index) => {
						const text = cell.textContent || '';
						const parsed = parseDate(text);
						if (parsed) {
							// Use adjacent cell as event description
							const eventCell = cells[index === 0 ? 1 : index - 1];
							const eventText = eventCell?.textContent?.trim() || 'Event';

							results.push({
								event: eventText,
								date: parsed.toISOString(),
								category: categorizeEvent(eventText),
								deadline: isDeadline(eventText),
								sourceUrl: window.location.href,
								scrapedAt: new Date().toISOString(),
							});
						}
					});
				}
			});
		}
	});

	return results;
}

function extractFromSections(): ScrapedDate[] {
	const results: ScrapedDate[] = [];
	const sections = document.querySelectorAll('section, article, div.content, div.main, main');

	sections.forEach((section) => {
		// Look for term headings
		const headings = section.querySelectorAll('h2, h3, h4');
		let currentTerm: string | undefined;

		headings.forEach((heading) => {
			const headingText = heading.textContent || '';
			const term = extractTermFromText(headingText);
			if (term) {
				currentTerm = term;
			}

			// Look for dates in the heading's following siblings
			let sibling = heading.nextElementSibling;
			let count = 0;

			while (sibling && count < 10) {
				// Check next 10 siblings
				const text = sibling.textContent || '';

				// Extract dates from text
				const dateStrings = extractDatesFromText(text);

				dateStrings.forEach((dateStr) => {
					const parsed = parseDate(dateStr);
					if (parsed) {
						const eventText = extractEventText(text, dateStr);

						results.push({
							event: eventText,
							date: parsed.toISOString(),
							term: currentTerm,
							category: categorizeEvent(eventText),
							deadline: isDeadline(eventText),
							sourceUrl: window.location.href,
							scrapedAt: new Date().toISOString(),
						});
					}
				});

				sibling = sibling.nextElementSibling;
				count++;
			}
		});
	});

	return results;
}

function extractFromLists(): ScrapedDate[] {
	const results: ScrapedDate[] = [];
	const lists = document.querySelectorAll('ul, ol');

	lists.forEach((list) => {
		const items = list.querySelectorAll('li');

		// Check if parent has term information
		let currentTerm: string | undefined;
		const parentText = list.parentElement?.textContent || '';
		currentTerm = extractTermFromText(parentText);

		items.forEach((item) => {
			const text = item.textContent || '';

			// Extract dates from list item
			const dateStrings = extractDatesFromText(text);

			dateStrings.forEach((dateStr) => {
				const parsed = parseDate(dateStr);
				if (parsed) {
					const eventText = extractEventText(text, dateStr);

					// Skip if event text is too short (likely not a real event)
					if (eventText.length < 3) return;

					results.push({
						event: eventText,
						date: parsed.toISOString(),
						term: currentTerm,
						category: categorizeEvent(eventText),
						deadline: isDeadline(eventText),
						sourceUrl: window.location.href,
						scrapedAt: new Date().toISOString(),
					});
				}
			});
		});
	});

	return results;
}

function deduplicateDates(dates: ScrapedDate[]): ScrapedDate[] {
	const seen = new Set<string>();
	const unique: ScrapedDate[] = [];

	dates.forEach((date) => {
		const key = `${date.event}|${date.date}`;
		if (!seen.has(key)) {
			seen.add(key);
			unique.push(date);
		}
	});

	return unique;
}
