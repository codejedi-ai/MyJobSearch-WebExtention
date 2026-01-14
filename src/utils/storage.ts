import { ScrapedDateCollection, StorageData } from '../types';

export function generateStorageKey(url: string): string {
	try {
		const urlObj = new URL(url);
		// Create a consistent key from hostname and pathname
		return `${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, '');
	} catch (e) {
		// If URL parsing fails, use a sanitized version of the URL
		return url.replace(/[^a-zA-Z0-9]/g, '_');
	}
}

export async function saveDates(url: string, data: ScrapedDateCollection): Promise<void> {
	const key = generateStorageKey(url);
	const existing = await chrome.storage.local.get('scraped_dates') as StorageData;
	const scrapedDates = existing.scraped_dates || {};

	scrapedDates[key] = {
		...data,
		version: 1,
		scrapedAt: new Date().toISOString(),
	};

	await chrome.storage.local.set({ scraped_dates: scrapedDates });
}

export async function getDates(url?: string): Promise<Record<string, ScrapedDateCollection>> {
	const data = await chrome.storage.local.get('scraped_dates') as StorageData;
	const allDates = data.scraped_dates || {};

	if (url) {
		const key = generateStorageKey(url);
		return { [key]: allDates[key] };
	}

	return allDates;
}

export async function getAllDates(): Promise<Record<string, ScrapedDateCollection>> {
	return getDates();
}

export async function clearDates(url?: string): Promise<void> {
	if (url) {
		const key = generateStorageKey(url);
		const data = await chrome.storage.local.get('scraped_dates') as StorageData;
		const scrapedDates = data.scraped_dates || {};

		delete scrapedDates[key];
		await chrome.storage.local.set({ scraped_dates: scrapedDates });
	} else {
		// Clear all scraped dates
		await chrome.storage.local.set({ scraped_dates: {} });
	}
}

export async function getSettings(): Promise<StorageData['settings']> {
	const data = await chrome.storage.local.get('settings') as StorageData;
	return data.settings || {
		autoScrape: true,
		notifyOnNewDates: false,
	};
}

export async function saveSettings(settings: StorageData['settings']): Promise<void> {
	await chrome.storage.local.set({ settings });
}
