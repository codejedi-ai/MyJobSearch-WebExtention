import { ExtensionMessage, ScrapedDate, ScrapedDateCollection } from './types';
import { saveDates, getDates, clearDates } from './utils/storage';

console.log('Background service worker loaded');

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
	console.log('Background received message:', message.type);

	switch (message.type) {
		case 'START_ELEMENT_PICKER':
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0]?.id;
				if (!tabId) {
					sendResponse({ success: false, error: 'No active tab' });
					return;
				}
				chrome.tabs.sendMessage(tabId, { type: 'START_ELEMENT_PICKER' }, (resp) => {
					sendResponse(resp || { success: true });
				});
			});
			return true;

		case 'LOG_PAGE_TEXT':
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0]?.id;
				if (!tabId) {
					sendResponse({ success: false, error: 'No active tab' });
					return;
				}
				chrome.scripting.executeScript({
					target: { tabId },
					func: () => {
						const text = document.body?.innerText || '';
						console.log('=== PAGE TEXT START ===');
						console.log(text);
						console.log('=== PAGE TEXT END ===');
					},
				}, () => {
					sendResponse({ success: true });
				});
			});
			return true;

		case 'SAVE_ELEMENT':
			handleSaveElement(message as any)
				.then(() => sendResponse({ success: true }))
				.catch((error) => {
					console.error('Error saving element:', error);
					sendResponse({ success: false, error: error.message });
				});
			return true;

		case 'REQUEST_SAVE_HTML':
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0]?.id;
				if (!tabId) {
					sendResponse({ success: false, error: 'No active tab' });
					return;
				}
				chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_PAGE' }, (resp) => {
					sendResponse(resp || { success: true });
				});
			});
			return true;

		case 'PRINT_PAGE':
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0]?.id;
				if (!tabId) {
					sendResponse({ success: false, error: 'No active tab' });
					return;
				}
				chrome.scripting.executeScript({
					target: { tabId },
					func: () => window.print(),
				}, () => sendResponse({ success: true }));
			});
			return true;

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
	if (changeInfo.status === 'complete') {
		if (tab.url) {
			console.log('Page loaded URL:', tab.url);
			if (matchesTargetPattern(tab.url)) {
				console.log('Matched target pattern:', tab.url);
			}
		} else {
			console.log('Page loaded but URL unavailable (permissions). Tab ID:', tabId);
		}
	}
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
	try {
		const tab = await chrome.tabs.get(activeInfo.tabId);
		if (tab.url) {
			console.log('Active tab URL:', tab.url);
		} else {
			console.log('Active tab switched; URL unavailable (permissions). Tab ID:', activeInfo.tabId);
		}
	} catch (e) {
		console.error('Error getting active tab info:', e);
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

async function handleSaveElement(message: any): Promise<void> {
	const { elementHtml, elementJson, filename } = message;

	try {
		const htmlBlob = new Blob([elementHtml], { type: 'text/html' });
		const htmlUrl = URL.createObjectURL(htmlBlob);
		chrome.downloads.download({ url: htmlUrl, filename, saveAs: false });
	} catch (error) {
		console.error('Error saving element HTML:', error);
	}

	try {
		const jsonFilename = filename.replace('.html', '.json');
		const jsonContent = JSON.stringify(elementJson, null, 2);
		const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
		const jsonUrl = URL.createObjectURL(jsonBlob);
		chrome.downloads.download({ url: jsonUrl, filename: jsonFilename, saveAs: false });
	} catch (error) {
		console.error('Error saving element JSON:', error);
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

	// Create context menu for Simplify-like action
	try {
		chrome.contextMenus.create({
			id: 'myjobsearch-simplify',
			title: 'Simplify selected text',
			contexts: ['selection'],
		});
		chrome.contextMenus.create({
			id: 'myjobsearch-simplify-page',
			title: 'Simplify current page',
			contexts: ['page'],
		});
		console.log('Context menu created: myjobsearch-simplify');
	} catch (e) {
		console.warn('Could not create context menu:', e);
	}
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === 'myjobsearch-simplify') {
		const text = (info.selectionText || '').trim();
		if (!text) {
			console.log('No selection text received from context menu');
			return;
		}
		if (!tab?.id) {
			console.log('No tab ID to show simplify result');
			return;
		}
		chrome.tabs.sendMessage(tab.id, {
			type: 'SHOW_SIMPLIFY_RESULT',
			text,
		}, (resp) => {
			if (chrome.runtime.lastError) {
				console.warn('Content script not available; attempting injection via scripting');
				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: (t) => {
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
						const close = document.createElement('button');
						close.textContent = '×';
						close.style.marginLeft = '8px';
						close.style.background = 'transparent';
						close.style.color = '#cbd5e1';
						close.style.border = 'none';
						close.style.cursor = 'pointer';
						close.style.fontSize = '18px';
						close.style.float = 'right';
						close.onclick = () => el.remove();
						const title = document.createElement('div');
						title.textContent = 'Simplify preview';
						title.style.fontWeight = '600';
						title.style.marginBottom = '6px';
						const body = document.createElement('div');
						body.textContent = t;
						body.style.whiteSpace = 'pre-wrap';
						body.style.lineHeight = '1.5';
						el.appendChild(close);
						el.appendChild(title);
						el.appendChild(body);
						document.body.appendChild(el);
					},
					args: [text],
				});
			}
			if (info.menuItemId === 'myjobsearch-simplify-page' && tab?.id) {
				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: () => document.body?.innerText || '',
				}, (results) => {
					const text = results && results[0] && results[0].result ? results[0].result as string : '';
					if (!text) {
						console.log('No page text found to simplify');
						return;
					}
					chrome.tabs.sendMessage(tab.id!, {
						type: 'SHOW_SIMPLIFY_RESULT',
						text,
					});
				});
			}
		});

		// Handle SIMPLIFY_PAGE from popup: extract page text and show overlay
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if (message && message.type === 'SIMPLIFY_PAGE') {
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					const tabId = tabs[0]?.id;
					if (!tabId) {
						sendResponse({ success: false, error: 'No active tab' });
						return;
					}
					chrome.scripting.executeScript({
						target: { tabId },
						func: () => document.body?.innerText || '',
					}, (results) => {
						const text = results && results[0] && results[0].result ? results[0].result as string : '';
						if (!text) {
							sendResponse({ success: false, error: 'No page text found' });
							return;
						}
						chrome.tabs.sendMessage(tabId, { type: 'SHOW_SIMPLIFY_RESULT', text }, () => {
							sendResponse({ success: true });
						});
					});
				});
				return true; // async
			}
		});
	}
});
