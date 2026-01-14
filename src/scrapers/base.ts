import { JobPosting, ApplicationQuestion, JobPlatform } from '../types';

export interface JobScraper {
	platform: JobPlatform;
	canScrape(url: string): boolean;
	scrapeJob(): JobPosting | null;
	scrapeJobList?(): JobPosting[];
	detectApplicationQuestions?(): ApplicationQuestion[];
}

export abstract class BaseJobScraper implements JobScraper {
	abstract platform: JobPlatform;
	abstract urlPattern: RegExp;

	canScrape(url: string): boolean {
		return this.urlPattern.test(url);
	}

	abstract scrapeJob(): JobPosting | null;

	protected generateJobId(url: string): string {
		const timestamp = Date.now();
		const urlHash = url.split('').reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc);
		}, 0);
		return `${this.platform}-${urlHash}-${timestamp}`;
	}

	protected cleanText(text: string | null | undefined): string {
		if (!text) return '';
		return text.trim().replace(/\s+/g, ' ').replace(/\n+/g, '\n');
	}

	protected extractSkills(text: string): string[] {
		const skillPatterns = [
			// Programming languages
			/\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin|Scala)\b/gi,
			// Frameworks
			/\b(React|Angular|Vue|Node\.?js|Django|Flask|Spring|Rails|Laravel|Express)\b/gi,
			// Technologies
			/\b(AWS|Azure|GCP|Docker|Kubernetes|Git|PostgreSQL|MySQL|MongoDB|Redis)\b/gi,
			// Skills
			/\b(Machine Learning|AI|DevOps|Agile|Scrum|CI\/CD|REST|GraphQL)\b/gi,
		];

		const skills = new Set<string>();
		skillPatterns.forEach((pattern) => {
			const matches = text.matchAll(pattern);
			for (const match of matches) {
				skills.add(match[0]);
			}
		});

		return Array.from(skills);
	}

	protected extractKeywords(text: string): string[] {
		// Remove common words and extract meaningful keywords
		const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
		const words = text.toLowerCase().split(/\W+/);
		const keywords = words
			.filter((word) => word.length > 3 && !commonWords.has(word))
			.reduce((acc, word) => {
				acc[word] = (acc[word] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

		// Return top 20 keywords by frequency
		return Object.entries(keywords)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 20)
			.map(([word]) => word);
	}

	protected extractSalary(text: string): string | undefined {
		const salaryPatterns = [
			/\$[\d,]+\s*-\s*\$[\d,]+/,
			/\$[\d,]+\s*(?:per|\/)\s*(?:year|hour|yr|hr)/i,
			/[\d,]+k\s*-\s*[\d,]+k/i,
		];

		for (const pattern of salaryPatterns) {
			const match = text.match(pattern);
			if (match) {
				return match[0];
			}
		}

		return undefined;
	}
}
