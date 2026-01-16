export interface ScrapedDate {
	event: string;
	date: string; // ISO 8601 format
	term?: string; // e.g., "Winter 2025"
	category: string; // "registration", "deadline", "exam", "academic", "closure", "other"
	deadline?: boolean;
	sourceUrl: string;
	scrapedAt: string; // ISO 8601 timestamp
}

export interface ScrapedDateCollection {
	sourceUrl: string;
	university?: string;
	department?: string;
	scrapedAt: string; // ISO 8601 timestamp
	dates: ScrapedDate[];
	version: number;
}

export interface BaseMessage {
	type: string;
	timestamp?: string;
}

export interface ExtractPageDataMessage extends BaseMessage {
	type: 'EXTRACT_PAGE_DATA';
}

export interface DownloadJSONMessage extends BaseMessage {
	type: 'DOWNLOAD_JSON';
	data: any;
}

export type ExtensionMessage = ExtractPageDataMessage | DownloadJSONMessage;

export interface ScrapedDatesMessage extends BaseMessage {
	type: 'SCRAPED_DATES';
	data: ScrapedDate[];
	sourceUrl: string;
}

export interface GetStoredDatesMessage extends BaseMessage {
	type: 'GET_STORED_DATES';
	url?: string; // If undefined, get all
}

export interface StoredDatesResponse extends BaseMessage {
	type: 'STORED_DATES';
	data: Record<string, ScrapedDateCollection>;
}

export interface ClearStorageMessage extends BaseMessage {
	type: 'CLEAR_STORAGE';
	url?: string; // If undefined, clear all
}

// (removed duplicate SaveHTMLMessage and RequestSaveHtmlMessage definitions)

export interface PrintPageMessage extends BaseMessage {
	type: 'PRINT_PAGE';
}

export interface StartElementPickerMessage extends BaseMessage {
	type: 'START_ELEMENT_PICKER';
}

export interface SaveElementMessage extends BaseMessage {
	type: 'SAVE_ELEMENT';
	elementHtml: string;
	elementJson: any;
	filename: string;
}

export interface LogPageTextMessage extends BaseMessage {
	type: 'LOG_PAGE_TEXT';
}

export interface ShowSimplifyResultMessage extends BaseMessage {
	type: 'SHOW_SIMPLIFY_RESULT';
	text: string;
}

export interface SimplifyPageMessage extends BaseMessage {
	type: 'SIMPLIFY_PAGE';
}

// (removed duplicate ExtensionMessage union)

export interface StorageData {
	scraped_dates?: Record<string, ScrapedDateCollection>;
	scraped_jobs?: Record<string, JobPosting>;
	user_profile?: UserProfile;
	settings?: {
		autoScrape: boolean;
		notifyOnNewDates: boolean;
		autoApply: boolean;
		autoApplyFilters?: JobFilters;
	};
}

// Job Scraping Types
export interface JobPosting {
	id: string; // Unique identifier (generated from URL + timestamp)
	platform: JobPlatform;
	url: string;
	scrapedAt: string; // ISO 8601 timestamp

	// Basic Info
	title: string;
	company: string;
	location: string;
	salary?: string;
	postedDate?: string;
	deadline?: string;

	// Full Description
	description: string;
	responsibilities?: string;
	requirements?: string;

	// Extracted Data
	skills?: string[];
	keywords?: string[];
	culturalDescription?: string;

	// Company Info
	employer?: string;
	hiringManager?: string;
	hiringStrategy?: string;
	hiringPipeline?: string;

	// Application Info
	applicationQuestions?: ApplicationQuestion[];
	applicationStatus?: ApplicationStatus;
	appliedAt?: string;

	// Metadata
	saved: boolean;
	notes?: string;
	tags?: string[];
}

export type JobPlatform =
	| 'workday'
	| 'waterlooworks'
	| 'linkedin'
	| 'indeed'
	| 'glassdoor'
	| 'dayforce'
	| 'bamboohr'
	| 'greenhouse'
	| 'lever'
	| 'generic';

export type ApplicationStatus =
	| 'not_applied'
	| 'applying'
	| 'applied'
	| 'interview'
	| 'rejected'
	| 'offer';

export interface ApplicationQuestion {
	question: string;
	type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
	required: boolean;
	options?: string[];
	answer?: string;
}

export interface JobFilters {
	minSalary?: number;
	maxSalary?: number;
	locations?: string[];
	requiredKeywords?: string[];
	excludedKeywords?: string[];
	platforms?: JobPlatform[];
}

export interface UserProfile {
	// Personal Info
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;

	// Professional Info
	linkedinUrl?: string;
	portfolioUrl?: string;
	githubUrl?: string;

	// Work Authorization
	workAuthorization?: string;
	requiresSponsorship?: boolean;

	// Education
	education?: Education[];

	// Experience
	experience?: WorkExperience[];

	// Skills
	skills?: string[];

	// Documents
	resumeUrl?: string;
	coverLetterTemplate?: string;

	// Preferences
	preferredLocations?: string[];
	preferredJobTypes?: string[];
	minSalary?: number;
}

export interface Education {
	institution: string;
	degree: string;
	field: string;
	startDate: string;
	endDate?: string;
	gpa?: number;
	current?: boolean;
}

export interface WorkExperience {
	company: string;
	title: string;
	startDate: string;
	endDate?: string;
	current?: boolean;
	description: string;
	achievements?: string[];
}

// Job-related Messages
export interface ScrapeJobMessage extends BaseMessage {
	type: 'SCRAPE_JOB';
	url: string;
	platform: JobPlatform;
}

export interface JobScrapedMessage extends BaseMessage {
	type: 'JOB_SCRAPED';
	job: JobPosting;
}

export interface GetJobsMessage extends BaseMessage {
	type: 'GET_JOBS';
	filters?: JobFilters;
}

export interface AutoApplyMessage extends BaseMessage {
	type: 'AUTO_APPLY';
	jobId: string;
}

export interface UpdateJobStatusMessage extends BaseMessage {
	type: 'UPDATE_JOB_STATUS';
	jobId: string;
	status: ApplicationStatus;
}

// Extend ExtensionMessage type
export type JobExtensionMessage =
	| ScrapeJobMessage
	| JobScrapedMessage
	| GetJobsMessage
	| AutoApplyMessage
	| UpdateJobStatusMessage;

export type AllExtensionMessages = ExtensionMessage | JobExtensionMessage | ChatExtensionMessage;

// Chat Service Types
export type ChatPlatform = 'deepseek' | 'chatgpt' | 'claude' | 'gemini' | 'qwen';

export interface ChatMessage {
	platform: ChatPlatform;
	role: 'user' | 'assistant';
	content: string; // Markdown format
	timestamp: string;
	sourceUrl: string;
	conversationId?: string;
}

// Chat-related Messages
export interface SendChatMessageAction extends BaseMessage {
	type: 'SEND_CHAT_MESSAGE';
	message: ChatMessage;
}

export interface ChatMessageSentResponse extends BaseMessage {
	type: 'CHAT_MESSAGE_SENT';
	success: boolean;
	error?: string;
}

export type ChatExtensionMessage = SendChatMessageAction | ChatMessageSentResponse;
