import { BaseJobScraper } from './base';
import { JobPosting, ApplicationQuestion } from '../types';

export class WorkdayScraper extends BaseJobScraper {
	platform = 'workday' as const;
	urlPattern = /myworkdaysite\.com|myworkday\.com\/.*\/job/i;

	scrapeJob(): JobPosting | null {
		try {
			const title = this.scrapeTitle();
			const company = this.scrapeCompany();
			const location = this.scrapeLocation();
			const description = this.scrapeDescription();

			if (!title || !description) {
				console.warn('Workday: Missing required fields (title or description)');
				return null;
			}

			const job: JobPosting = {
				id: this.generateJobId(window.location.href),
				platform: this.platform,
				url: window.location.href,
				scrapedAt: new Date().toISOString(),
				title,
				company: company || 'Unknown Company',
				location: location || 'Unknown Location',
				description,
				responsibilities: this.scrapeResponsibilities(),
				requirements: this.scrapeRequirements(),
				skills: this.extractSkills(description),
				keywords: this.extractKeywords(description),
				salary: this.scrapeSalary(),
				postedDate: this.scrapePostedDate(),
				applicationQuestions: this.detectApplicationQuestions(),
				saved: true,
				applicationStatus: 'not_applied',
			};

			return job;
		} catch (error) {
			console.error('Workday scraper error:', error);
			return null;
		}
	}

	private scrapeTitle(): string {
		const selectors = [
			'[data-automation-id="jobPostingHeader"]',
			'h1[class*="title"]',
			'h2[data-automation-id="job-title"]',
			'.css-1id4k1v', // Common Workday class
			'h1',
		];

		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element?.textContent) {
				return this.cleanText(element.textContent);
			}
		}

		return '';
	}

	private scrapeCompany(): string {
		const selectors = [
			'[data-automation-id="company"]',
			'[data-automation-id="companyLocation"]',
			'.css-1t92pv',
		];

		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element?.textContent) {
				return this.cleanText(element.textContent);
			}
		}

		// Try extracting from URL
		const urlMatch = window.location.href.match(/\/\/([^.]+)\./);
		if (urlMatch) {
			return urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
		}

		return '';
	}

	private scrapeLocation(): string {
		const selectors = [
			'[data-automation-id="locations"]',
			'[data-automation-id="location"]',
			'dd[data-automation-id="jobLocation"]',
			'.css-cygeeu',
		];

		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element?.textContent) {
				return this.cleanText(element.textContent);
			}
		}

		return '';
	}

	private scrapeDescription(): string {
		const selectors = [
			'[data-automation-id="jobPostingDescription"]',
			'[data-automation-id="job-description"]',
			'.css-1uobp1k',
			'#jobDescription',
		];

		for (const selector of selectors) {
			const element = document.querySelector(selector);
			if (element?.textContent) {
				return this.cleanText(element.textContent);
			}
		}

		return '';
	}

	private scrapeResponsibilities(): string | undefined {
		const description = this.scrapeDescription();
		const responsibilitiesMatch = description.match(
			/(?:Responsibilities|What You'll Do|Your Role)[\s:]*([^]*?)(?=(?:Qualifications|Requirements|Skills|About|$))/i
		);
		return responsibilitiesMatch ? this.cleanText(responsibilitiesMatch[1]) : undefined;
	}

	private scrapeRequirements(): string | undefined {
		const description = this.scrapeDescription();
		const requirementsMatch = description.match(
			/(?:Qualifications|Requirements|Required Skills|What We're Looking For)[\s:]*([^]*?)(?=(?:Responsibilities|Benefits|About|$))/i
		);
		return requirementsMatch ? this.cleanText(requirementsMatch[1]) : undefined;
	}

	private scrapeSalary(): string | undefined {
		const salarySelectors = [
			'[data-automation-id="payRange"]',
			'[data-automation-id="compensation"]',
			'.salary',
		];

		for (const selector of salarySelectors) {
			const element = document.querySelector(selector);
			if (element?.textContent) {
				return this.cleanText(element.textContent);
			}
		}

		// Try extracting from description
		const description = this.scrapeDescription();
		return this.extractSalary(description);
	}

	private scrapePostedDate(): string | undefined {
		const dateSelectors = [
			'[data-automation-id="postedOn"]',
			'[data-automation-id="posted-date"]',
			'.posted-date',
		];

		for (const selector of dateSelectors) {
			const element = document.querySelector(selector);
			if (element?.textContent) {
				return this.cleanText(element.textContent);
			}
		}

		return undefined;
	}

	detectApplicationQuestions(): ApplicationQuestion[] {
		const questions: ApplicationQuestion[] = [];

		// Look for form fields
		const formFields = document.querySelectorAll('[data-automation-id*="question"], input[aria-label], select[aria-label], textarea[aria-label]');

		formFields.forEach((field) => {
			const label = field.getAttribute('aria-label') || field.getAttribute('data-automation-label') || '';
			if (!label) return;

			const tagName = field.tagName.toLowerCase();
			let type: ApplicationQuestion['type'] = 'text';
			let options: string[] | undefined;

			if (tagName === 'select') {
				type = 'select';
				options = Array.from(field.querySelectorAll('option')).map((opt) => opt.textContent || '');
			} else if (tagName === 'textarea') {
				type = 'textarea';
			} else if (field.getAttribute('type') === 'file') {
				type = 'file';
			} else if (field.getAttribute('type') === 'checkbox') {
				type = 'checkbox';
			} else if (field.getAttribute('type') === 'radio') {
				type = 'radio';
			}

			questions.push({
				question: label,
				type,
				required: field.hasAttribute('required') || field.getAttribute('aria-required') === 'true',
				options,
			});
		});

		return questions;
	}
}
