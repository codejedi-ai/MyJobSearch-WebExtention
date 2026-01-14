import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { ScrapedDateCollection } from '../types';
import './style.css';

export function PopupApp() {
	const [storedDates, setStoredDates] = useState<Record<string, ScrapedDateCollection>>({});
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<string | null>(null);

	useEffect(() => {
		loadDates();
	}, []);

	const loadDates = () => {
		setLoading(true);
		chrome.runtime.sendMessage(
			{
				type: 'GET_STORED_DATES',
				timestamp: new Date().toISOString(),
			},
			(response) => {
				if (response && response.type === 'STORED_DATES') {
					setStoredDates(response.data);

					// Set first tab as active
					const keys = Object.keys(response.data);
					if (keys.length > 0 && !activeTab) {
						setActiveTab(keys[0]);
					}
				}
				setLoading(false);
			}
		);
	};

	const exportToJSON = () => {
		const dataStr = JSON.stringify(storedDates, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `academic-dates-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const clearAllData = () => {
		if (confirm('Are you sure you want to clear all scraped data?')) {
			chrome.runtime.sendMessage(
				{
					type: 'CLEAR_STORAGE',
					timestamp: new Date().toISOString(),
				},
				() => {
					setStoredDates({});
					setActiveTab(null);
				}
			);
		}
	};

	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	if (loading) {
		return (
			<div class="popup-container">
				<header class="popup-header">
					<h1>MyJobSearch</h1>
					<p>Academic Date Scraper</p>
				</header>
				<div class="loading">Loading...</div>
			</div>
		);
	}

	const dateCollections = Object.values(storedDates);

	if (dateCollections.length === 0) {
		return (
			<div class="popup-container">
				<header class="popup-header">
					<h1>MyJobSearch</h1>
					<p>Academic Date Scraper</p>
				</header>
				<div class="empty-state">
					<p>No dates scraped yet.</p>
					<p class="hint">Visit a university's important dates page to start scraping!</p>
				</div>
			</div>
		);
	}

	const activeCollection = activeTab ? storedDates[activeTab] : null;

	return (
		<div class="popup-container">
			<header class="popup-header">
				<h1>MyJobSearch</h1>
				<p>Academic Date Scraper</p>
			</header>

			<div class="tabs">
				{Object.keys(storedDates).map((key) => {
					const collection = storedDates[key];
					return (
						<button
							key={key}
							class={`tab ${activeTab === key ? 'active' : ''}`}
							onClick={() => setActiveTab(key)}
						>
							{collection.university || key}
						</button>
					);
				})}
			</div>

			{activeCollection && (
				<div class="content">
					<div class="collection-info">
						<h2>{activeCollection.university || 'Unknown University'}</h2>
						<p class="metadata">
							{activeCollection.dates.length} dates scraped
							<br />
							<span class="timestamp">
								Last updated: {formatDate(activeCollection.scrapedAt)}
							</span>
						</p>
					</div>

					<div class="dates-list">
						{activeCollection.dates.map((date, index) => (
							<div key={index} class={`date-item ${date.category}`}>
								<div class="date-header">
									<span class="event-name">{date.event}</span>
									{date.deadline && <span class="deadline-badge">Deadline</span>}
								</div>
								<div class="date-details">
									<span class="date-value">{formatDate(date.date)}</span>
									{date.term && <span class="term">{date.term}</span>}
									<span class={`category-badge ${date.category}`}>{date.category}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<footer class="popup-footer">
				<button onClick={exportToJSON} class="btn btn-primary">
					Export JSON
				</button>
				<button onClick={clearAllData} class="btn btn-secondary">
					Clear All
				</button>
			</footer>
		</div>
	);
}
