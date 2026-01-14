import { ExtensionMessage, ScrapedDate, ScrapedDateCollection } from './types';
import { saveDates, getDates, clearDates } from './utils/storage';

console.log('Background service worker loaded');

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
	console.log('Background received message:', message.type);

	switch (message.type) {
		case 'SAVE_HTML':
			handleSaveHTML(message as any)
				.then(() => {
					sendResponse({ success: true });
				})
				.catch((error) => {
					console.error('Error saving HTML:', error);
					sendResponse({ success: false, error: error.message });
				});
			return true; // Keep channel open for async response

		case 'SCRAPED_DATES':
			handleScrapedDates(message.data, message.sourceUrl)
				.then(() => {
					sendResponse({ success: true });
				})
				.catch((error) => {
					console.error('Error handling scraped dates:', error);
					sendResponse({ success: false, error: error.message });
				});
			return true; // Keep channel open for async response

		case 'GET_STORED_DATES':
			getDates(message.url)
				.then((data) => {
					sendResponse({
						type: 'STORED_DATES',
						data,
						timestamp: new Date().toISOString(),
					});
				})
				.catch((error) => {
					console.error('Error getting stored dates:', error);
					sendResponse({ success: false, error: error.message });
				});
			return true;

		case 'CLEAR_STORAGE':
			clearDates(message.url)
				.then(() => {
					sendResponse({ success: true });
				})
				.catch((error) => {
					console.error('Error clearing storage:', error);
					sendResponse({ success: false, error: error.message });
				});
			return true;

		default:
			console.warn('Unknown message type:', message.type);
			sendResponse({ success: false, error: 'Unknown message type' });
	}
});

async function handleScrapedDates(dates: ScrapedDate[], sourceUrl: string): Promise<void> {
	console.log(`Processing ${dates.length} scraped dates from ${sourceUrl}`);

	// Validate dates
	const validDates = dates.filter((date) => {
		if (!date.event || !date.date || !date.category) {
			console.warn('Invalid date entry:', date);
			return false;
		}
		return true;
	});

	if (validDates.length === 0) {
		console.warn('No valid dates to save');
		return;
	}

	// Extract university name from URL
	const university = extractUniversityName(sourceUrl);

	// Create collection
	const collection: ScrapedDateCollection = {
		sourceUrl,
		university,
		scrapedAt: new Date().toISOString(),
		dates: validDates,
		version: 1,
	};

	// Save to storage
	await saveDates(sourceUrl, collection);
	console.log(`Saved ${validDates.length} dates to storage`);
}

function extractUniversityName(url: string): string | undefined {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname;

		// Extract university name from common patterns
		if (hostname.includes('uwaterloo.ca')) {
			return 'University of Waterloo';
		}
		if (hostname.includes('mit.edu')) {
			return 'Massachusetts Institute of Technology';
		}
		if (hostname.includes('stanford.edu')) {
			return 'Stanford University';
		}
		if (hostname.includes('harvard.edu')) {
			return 'Harvard University';
		}

		// Generic extraction: capitalize domain parts
		const parts = hostname.split('.');
		if (parts.length >= 2) {
			const name = parts[parts.length - 2];
			return name.charAt(0).toUpperCase() + name.slice(1);
		}

		return undefined;
	} catch (e) {
		return undefined;
	}
}

// Listen for tab updates to potentially inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url) {
		if (matchesTargetPattern(tab.url)) {
			console.log('Matched target pattern:', tab.url);
			// Content script should already be injected via manifest
			// This listener is here for future enhancements
		}
	}
});

async function handleSaveHTML(message: any): Promise<void> {
	const { html, filename, url, timestamp } = message;
	const { json } = message;
	
	console.log(`Saving HTML for: ${url}`);
	console.log(`Filename: ${filename}`);
	
	// Try to download the file
	try {
		const blob = new Blob([html], { type: 'text/html' });
		const blobUrl = URL.createObjectURL(blob);
		
		chrome.downloads.download({
			url: blobUrl,
			filename: filename,
			saveAs: false,
		}, (downloadId) => {
			if (downloadId) {
				console.log(`✓ HTML saved with download ID: ${downloadId}`);
				console.log(`File: ${filename}`);
			}
		});
	} catch (error) {
		console.error('Error creating blob:', error);
		// Fallback: log the HTML size info
		console.log(`HTML size: ${(html.length / 1024).toFixed(2)} KB`);
	}

	// Save JSON file
	try {
		const jsonFilename = filename.replace('.html', '.json');
		const jsonContent = JSON.stringify(json, null, 2);
		const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
		const jsonBlobUrl = URL.createObjectURL(jsonBlob);
		
		// Delay JSON download slightly to avoid race conditions
		setTimeout(() => {
			chrome.downloads.download({
				url: jsonBlobUrl,
				filename: jsonFilename,
				saveAs: false,
			}, (downloadId) => {
				if (downloadId) {
					console.log(`✓ JSON saved with download ID: ${downloadId}`);
					console.log(`File: ${jsonFilename}`);
				}
			});
		}, 500);
	} catch (error) {
		console.error('Error creating JSON blob:', error);
	}
}

function matchesTargetPattern(url: string): boolean {
	const patterns = [
		/important-dates/i,
		/academic-calendar/i,
		/registrar/i,
		/graduate.*dates/i,
		/undergraduate.*dates/i,
	];

	return patterns.some((pattern) => pattern.test(url));
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
	console.log('Extension installed:', details.reason);

	if (details.reason === 'install') {
		// First time installation
		console.log('First time installation - setting defaults');
	} else if (details.reason === 'update') {
		// Extension updated
		console.log('Extension updated');
	}
});
