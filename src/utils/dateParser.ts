export function parseDate(dateStr: string): Date | null {
	if (!dateStr) return null;

	const cleanedStr = dateStr.trim();

	// Try multiple date formats
	const formats = [
		// "January 15, 2025" or "Jan 15, 2025"
		/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i,
		// "15 January 2025"
		/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i,
		// "01/15/2025" or "01-15-2025"
		/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/,
		// "2025-01-15" (ISO format)
		/\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/,
	];

	for (const format of formats) {
		const match = cleanedStr.match(format);
		if (match) {
			const parsed = new Date(match[0]);
			if (!isNaN(parsed.getTime())) {
				return parsed;
			}
		}
	}

	// Try parsing the entire string as a date
	const fallbackParsed = new Date(cleanedStr);
	if (!isNaN(fallbackParsed.getTime())) {
		return fallbackParsed;
	}

	return null;
}

export function extractTermFromText(text: string): string | undefined {
	const termPattern = /\b(Winter|Spring|Summer|Fall|Autumn)\s+20\d{2}\b/i;
	const match = text.match(termPattern);
	return match ? match[0] : undefined;
}

export function categorizeEvent(eventText: string): string {
	const text = eventText.toLowerCase();

	if (text.includes('registration') || text.includes('enrol') || text.includes('enroll')) {
		return 'registration';
	}
	if (text.includes('deadline') || text.includes('due') || text.includes('last day')) {
		return 'deadline';
	}
	if (text.includes('exam') || text.includes('final') || text.includes('test')) {
		return 'exam';
	}
	if (text.includes('term') || text.includes('semester') || text.includes('class')) {
		return 'academic';
	}
	if (text.includes('holiday') || text.includes('closure') || text.includes('closed')) {
		return 'closure';
	}

	return 'other';
}

export function isDeadline(eventText: string): boolean {
	const text = eventText.toLowerCase();
	return text.includes('deadline') || text.includes('due') || text.includes('last day') || text.includes('final day');
}

export function extractEventText(fullText: string, dateStr: string): string {
	// Remove the date string from the text to get the event description
	const eventText = fullText.replace(dateStr, '').trim();

	// Clean up common patterns
	const cleaned = eventText
		.replace(/^[\s\-:•]+/, '') // Remove leading punctuation
		.replace(/[\s\-:•]+$/, '') // Remove trailing punctuation
		.replace(/\s+/g, ' ') // Normalize whitespace
		.trim();

	return cleaned || fullText.trim();
}

export function normalizeDate(date: Date): string {
	// Return ISO 8601 format
	return date.toISOString();
}

export function extractDatesFromText(text: string): string[] {
	const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi;
	const matches = text.matchAll(datePattern);
	return Array.from(matches, match => match[0]);
}
