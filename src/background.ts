import { ExtensionMessage } from './types';

console.log('Background service worker loaded');

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  if (message.type === 'DOWNLOAD_JSON') {
    handleDownloadJSON(message as any)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Error downloading JSON:', error);
        const msg = (error && (error as Error).message) || 'Unknown error';
        sendResponse({ success: false, error: msg });
      });
    return true;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
});

async function handleDownloadJSON(message: any): Promise<void> {
  const { data } = message;

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const filename = `webpage_${new Date().getTime()}.json`;
    
    // Create a data URL instead of using URL.createObjectURL (not available in service worker)
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
    
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (downloadId) {
        console.log(`✓ JSON downloaded: ${filename}`);
      } else if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Error creating JSON data URL:', error);
    throw error;
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
		});
	}
	else if (info.menuItemId === 'myjobsearch-simplify-page' && tab?.id) {
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
