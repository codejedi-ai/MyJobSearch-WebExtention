import { ScrapedDate } from './types';
import { parseDate, extractTermFromText, categorizeEvent, isDeadline, extractEventText, extractDatesFromText } from './utils/dateParser';

console.log('Content script loaded on:', window.location.href);

// Listen for on-demand capture requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'CAPTURE_PAGE') {
		saveHTMLContent();
		sendResponse({ success: true });
		return true;
	}
	if (message.type === 'START_ELEMENT_PICKER') {
		startElementPicker();
		sendResponse({ success: true });
		return true;
	}
	if (message.type === 'LOG_PAGE_TEXT') {
		logPageText();
		sendResponse({ success: true });
		return true;
	}
	if (message.type === 'SHOW_SIMPLIFY_RESULT') {
		showSimplifyPopup(message.text);
		sendResponse({ success: true });
		return true;
	}
	return false;
});

let isPicking = false;
let lastHovered: HTMLElement | null = null;

function startElementPicker(): void {
	if (isPicking) return;
	isPicking = true;
	console.log('Element picker started. Hover and click an element to capture. Press ESC to cancel.');
	addPickerListeners();
}

function stopElementPicker(): void {
	isPicking = false;
	removePickerListeners();
	clearHighlight();
}

function addPickerListeners(): void {
	document.addEventListener('mousemove', handleHover, true);
	document.addEventListener('click', handleClick, true);
	document.addEventListener('keydown', handleKeydown, true);
}

function removePickerListeners(): void {
	document.removeEventListener('mousemove', handleHover, true);
	document.removeEventListener('click', handleClick, true);
	document.removeEventListener('keydown', handleKeydown, true);
}

function handleHover(event: MouseEvent): void {
	if (!isPicking) return;
	const target = event.target as (HTMLElement & { __picker_old_outline?: string }) | null;
	if (!target || target === lastHovered) return;
	clearHighlight();
	lastHovered = target;
	(lastHovered as any).__picker_old_outline = lastHovered.style.outline;
	lastHovered.style.outline = '2px solid #8a2be2';
}

function clearHighlight(): void {
	if (lastHovered) {
		lastHovered.style.outline = (lastHovered as any).__picker_old_outline || '';
		delete (lastHovered as any).__picker_old_outline;
		lastHovered = null;
	}
}

function handleClick(event: MouseEvent): void {
	if (!isPicking) return;
	event.preventDefault();
	event.stopPropagation();
	const target = event.target as HTMLElement | null;
	if (!target) {
		stopElementPicker();
		return;
	}

	const elementData = buildElementData(target);
	const filename = `element-${Date.now()}.html`;

	chrome.runtime.sendMessage({
		type: 'SAVE_ELEMENT',
		elementHtml: target.outerHTML,
		elementJson: elementData,
		filename,
		timestamp: new Date().toISOString(),
	}, () => {
		console.log('Element captured and sent for download');
	});

	stopElementPicker();
}

function handleKeydown(event: KeyboardEvent): void {
	if (!isPicking) return;
	if (event.key === 'Escape') {
		event.preventDefault();
		stopElementPicker();
		console.log('Element picker canceled');
	}
}

function buildElementData(el: HTMLElement): any {
	const rect = el.getBoundingClientRect();
	const attrs: Record<string, string> = {};
	Array.from(el.attributes).forEach((a) => {
		attrs[a.name] = a.value;
	});

	return {
		url: window.location.href,
		title: document.title,
		tag: el.tagName,
		id: el.id || null,
		classes: el.className || null,
		text: (el.innerText || '').trim(),
		outerHTML: el.outerHTML,
		attributes: attrs,
		href: (el as HTMLAnchorElement).href || null,
		src: (el as HTMLImageElement).src || null,
		boundingRect: {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
		},
		capturedAt: new Date().toISOString(),
	};
}

function logPageText(): void {
	const text = document.body?.innerText || '';
	console.log('=== PAGE TEXT START ===');
	console.log(text);
	console.log('=== PAGE TEXT END ===');
}

function showSimplifyPopup(text: string): void {
	const containerId = 'myjobsearch-simplify-popup';
	const existing = document.getElementById(containerId);
	if (existing) existing.remove();

	const el = document.createElement('div');
	el.id = containerId;
	el.style.position = 'fixed';
	el.style.top = '16px';
	el.style.right = '16px';
	el.style.maxWidth = '360px';
	el.style.background = '#1f2937';
	el.style.color = 'white';
	el.style.padding = '12px 14px';
	el.style.borderRadius = '12px';
	el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
	el.style.zIndex = '2147483647';
	el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial';

	const header = document.createElement('div');
	header.style.display = 'flex';
	header.style.alignItems = 'center';
	header.style.justifyContent = 'space-between';

	const title = document.createElement('div');
	title.textContent = 'Simplify preview';
	title.style.fontWeight = '600';
	title.style.marginBottom = '6px';

	const close = document.createElement('button');
	close.textContent = '×';
	close.style.marginLeft = '8px';
	close.style.background = 'transparent';
	close.style.color = '#cbd5e1';
	close.style.border = 'none';
	close.style.cursor = 'pointer';
	close.style.fontSize = '18px';
	close.onclick = () => el.remove();

	header.appendChild(title);
	header.appendChild(close);

	const body = document.createElement('div');
	body.textContent = text;
	body.style.whiteSpace = 'pre-wrap';
	body.style.lineHeight = '1.5';

	el.appendChild(header);
	el.appendChild(body);
	document.body.appendChild(el);
}

// Save HTML content for debugging
function saveHTMLContent(): void {
	const htmlContent = document.documentElement.outerHTML;
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const filename = `page-${timestamp}.html`;
	
	// Also create a JSON representation of the page
	const pageJSON = {
		url: window.location.href,
		timestamp: new Date().toISOString(),
		title: document.title,
		htmlSize: htmlContent.length,
		fullText: document.body?.innerText || '',
		pageStructure: extractPageStructure(),
		fullHTML: htmlContent, // Include full HTML for inspection
	};
	
	// Send to background worker to save
	chrome.runtime.sendMessage({
		type: 'SAVE_HTML',
		html: htmlContent,
		json: pageJSON,
		filename: filename,
		url: window.location.href,
		timestamp: new Date().toISOString(),
	}, (response) => {
		if (response && response.success) {
			console.log(`✓ HTML saved as: ${filename}`);
			console.log(`✓ JSON data available for download`);
			console.log('Note: Check your Downloads folder or enable DevTools to save files');
		} else {
			console.warn('Could not save HTML to file, but outputting to console below:');
			console.log('=== PAGE JSON DATA ===');
			console.log(JSON.stringify(pageJSON, null, 2));
			console.log('=== END PAGE JSON ===');
		}
	});
}

function extractPageStructure(): any {
	return {
		bodyText: document.body.innerText?.substring(0, 500) || '',
		headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
		links: Array.from(document.querySelectorAll('a')).map(a => ({
			text: a.textContent,
			href: a.href,
		})).slice(0, 20),
		tables: document.querySelectorAll('table').length,
		lists: document.querySelectorAll('ul, ol').length,
		forms: document.querySelectorAll('form').length,
		buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent).slice(0, 10),
	};
}

// Run scraping when page is fully loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', runScraper);
} else {
	runScraper();
}

function runScraper(): void {
	console.log('Starting scraping...');
	console.log('Saving page HTML for debugging...');
	saveHTMLContent();
	
	const dates = scrapePage();
	console.log(`Found ${dates.length} dates`);
	console.log('Scraped dates JSON:', JSON.stringify(dates, null, 2));

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
