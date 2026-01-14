# Job Automation Implementation Plan

This document outlines the comprehensive plan to expand the extension into a full job application automation system.

## Current Status

✅ **Completed:**
- Added comprehensive TypeScript types for job scraping
- Created base scraper class with common functionality
- Implemented Workday scraper with full job data extraction
- Added user profile system types

⏳ **In Progress:**
- Platform-specific scrapers
- Auto-fill and auto-apply functionality

## Implementation Roadmap

### Phase 1: Core Scraping Infrastructure (Current)

**Files Created:**
- `src/types/index.ts` - Extended with job types (✅ DONE)
- `src/scrapers/base.ts` - Base scraper class (✅ DONE)
- `src/scrapers/workday.ts` - Workday implementation (✅ DONE)

**Next Steps:**
1. Implement remaining scrapers:
   - `src/scrapers/waterlooworks.ts`
   - `src/scrapers/linkedin.ts`
   - `src/scrapers/indeed.ts`
   - `src/scrapers/greenhouse.ts`
   - `src/scrapers/lever.ts`
   - `src/scrapers/bamboohr.ts`
   - `src/scrapers/dayforce.ts`
   - `src/scrapers/generic.ts` (fallback)

2. Create scraper registry (`src/scrapers/index.ts`):
   ```typescript
   import { WorkdayScraper } from './workday';
   import { WaterlooWorksScraper } from './waterlooworks';
   // ... import all scrapers

   export const scrapers = [
     new WorkdayScraper(),
     new WaterlooWorksScraper(),
     // ... register all
   ];

   export function getScraperForUrl(url: string): JobScraper | null {
     return scrapers.find(s => s.canScrape(url)) || null;
   }
   ```

### Phase 2: Content Script Integration

**Update `src/content.ts`:**
```typescript
import { getScraperForUrl } from './scrapers';

// Add job scraping detection
function detectPageType(): 'academic_dates' | 'job_posting' | 'unknown' {
  const url = window.location.href;

  if (url.includes('important-dates') || url.includes('academic-calendar')) {
    return 'academic_dates';
  }

  const scraper = getScraperForUrl(url);
  if (scraper) {
    return 'job_posting';
  }

  return 'unknown';
}

function runScraper() {
  const pageType = detectPageType();

  if (pageType === 'academic_dates') {
    scrapeAcademicDates(); // existing function
  } else if (pageType === 'job_posting') {
    scrapeJobPosting();
  }
}

function scrapeJobPosting() {
  const scraper = getScraperForUrl(window.location.href);
  if (!scraper) return;

  const job = scraper.scrapeJob();
  if (job) {
    chrome.runtime.sendMessage({
      type: 'JOB_SCRAPED',
      job,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Phase 3: Storage System

**Update `src/utils/storage.ts`:**
```typescript
export async function saveJob(job: JobPosting): Promise<void> {
  const data = await chrome.storage.local.get('scraped_jobs');
  const jobs = data.scraped_jobs || {};

  jobs[job.id] = job;
  await chrome.storage.local.set({ scraped_jobs: jobs });
}

export async function getJobs(filters?: JobFilters): Promise<JobPosting[]> {
  const data = await chrome.storage.local.get('scraped_jobs');
  let jobs = Object.values(data.scraped_jobs || {});

  if (filters) {
    jobs = jobs.filter(job => matchesFilters(job, filters));
  }

  return jobs;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await chrome.storage.local.set({ user_profile: profile });
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const data = await chrome.storage.local.get('user_profile');
  return data.user_profile || null;
}
```

### Phase 4: Auto-Fill System

**Create `src/utils/autoFill.ts`:**
```typescript
import { UserProfile, ApplicationQuestion } from '../types';

export class AutoFillManager {
  private profile: UserProfile;

  constructor(profile: UserProfile) {
    this.profile = profile;
  }

  async fillForm(questions?: ApplicationQuestion[]): Promise<void> {
    // Fill basic fields
    this.fillBasicFields();

    // Fill resume/cover letter uploads
    await this.fillDocumentUploads();

    // Answer application questions
    if (questions) {
      this.answerQuestions(questions);
    }
  }

  private fillBasicFields(): void {
    // First Name
    this.fillField(['firstName', 'first-name', 'fname'], this.profile.firstName);

    // Last Name
    this.fillField(['lastName', 'last-name', 'lname'], this.profile.lastName);

    // Email
    this.fillField(['email', 'e-mail', 'emailAddress'], this.profile.email);

    // Phone
    this.fillField(['phone', 'phoneNumber', 'telephone'], this.profile.phone);

    // LinkedIn
    if (this.profile.linkedinUrl) {
      this.fillField(['linkedin', 'linkedIn', 'linkedInUrl'], this.profile.linkedinUrl);
    }

    // Additional fields...
  }

  private fillField(identifiers: string[], value: string): void {
    for (const id of identifiers) {
      // Try by ID
      let element = document.getElementById(id);

      // Try by name
      if (!element) {
        element = document.querySelector(`[name="${id}"]`);
      }

      // Try by aria-label
      if (!element) {
        element = document.querySelector(`[aria-label*="${id}" i]`);
      }

      if (element && element instanceof HTMLInputElement) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }

  private answerQuestions(questions: ApplicationQuestion[]): void {
    questions.forEach((q) => {
      // Implement smart question answering
      const answer = this.generateAnswer(q);
      if (answer) {
        this.fillQuestionField(q, answer);
      }
    });
  }

  private generateAnswer(question: ApplicationQuestion): string | undefined {
    const qLower = question.question.toLowerCase();

    // Work authorization
    if (qLower.includes('work authorization') || qLower.includes('authorized to work')) {
      return this.profile.workAuthorization || 'Yes';
    }

    // Sponsorship
    if (qLower.includes('sponsor')) {
      return this.profile.requiresSponsorship ? 'Yes' : 'No';
    }

    // Add more intelligent question answering...
    return undefined;
  }

  private async fillDocumentUploads(): Promise<void> {
    // This is complex - file uploads can't be automated easily due to security
    // Best approach: Show user a prompt to upload documents
    console.log('Document upload fields detected - user intervention required');
  }

  private fillQuestionField(question: ApplicationQuestion, answer: string): void {
    // Implementation to fill specific question fields
  }
}
```

### Phase 5: Auto-Apply Logic

**Update `src/background.ts`:**
```typescript
import { AutoFillManager } from './utils/autoFill';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ... existing handlers ...

  switch (message.type) {
    case 'JOB_SCRAPED':
      handleJobScraped(message.job);
      break;

    case 'AUTO_APPLY':
      handleAutoApply(message.jobId, sender.tab?.id);
      break;

    case 'GET_JOBS':
      getJobs(message.filters).then(jobs => {
        sendResponse({ jobs });
      });
      return true;
  }
});

async function handleJobScraped(job: JobPosting): Promise<void> {
  // Save job
  await saveJob(job);

  // Check if should auto-apply
  const settings = await getSettings();
  if (settings.autoApply) {
    const filters = settings.autoApplyFilters;
    if (!filters || matchesFilters(job, filters)) {
      // Trigger auto-apply
      await initiateAutoApply(job.id);
    }
  }
}

async function handleAutoApply(jobId: string, tabId?: number): Promise<void> {
  if (!tabId) return;

  const profile = await getUserProfile();
  if (!profile) {
    console.error('No user profile found - cannot auto-apply');
    return;
  }

  // Inject auto-fill script
  await chrome.scripting.executeScript({
    target: { tabId },
    func: autoFillAndApply,
    args: [profile],
  });
}

function autoFillAndApply(profile: UserProfile) {
  const autoFill = new AutoFillManager(profile);
  autoFill.fillForm();

  // Wait for form to be filled
  setTimeout(() => {
    // Find and click submit button
    const submitButton = document.querySelector(
      'button[type="submit"], input[type="submit"], [data-automation-id*="apply"], button:contains("Apply")'
    );

    if (submitButton instanceof HTMLElement) {
      submitButton.click();
    }
  }, 2000);
}
```

### Phase 6: UI Updates

**Update `public/manifest.json`:**
```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs"
  ],
  "host_permissions": [
    "https://*/*.myworkday.com/*",
    "https://waterlooworks.uwaterloo.ca/*",
    "https://www.linkedin.com/jobs/*",
    "https://www.indeed.com/*",
    "https://www.glassdoor.com/*",
    "https://*/greenhouse.io/*",
    "https://*/lever.co/*",
    "https://*/bamboohr.com/*",
    "https://*/dayforce.com/*",
    "https://uwaterloo.ca/*",
    "https://*.edu/*",
    "https://*.ac.uk/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://*/*.myworkday.com/*",
        "https://waterlooworks.uwaterloo.ca/*",
        "https://www.linkedin.com/jobs/*",
        "https://www.indeed.com/*",
        "https://*/apply/*",
        "https://*/careers/*",
        "https://*/jobs/*",
        "https://uwaterloo.ca/*/important-dates*",
        "https://*/academic-calendar*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "options_page": "options.html"
}
```

**Create `src/options/` directory for user profile configuration:**
- `options.html` - Options page HTML
- `options.tsx` - Preact component for profile editing
- Sections:
  - Personal Information
  - Education
  - Work Experience
  - Skills
  - Documents (resume/cover letter upload)
  - Preferences
  - Auto-Apply Settings

**Update popup to show jobs:**
```tsx
// Add tabs for:
// 1. Academic Dates (existing)
// 2. Saved Jobs
// 3. Application Status

interface PopupTab {
  label: string;
  value: 'dates' | 'jobs' | 'applications';
}

const tabs: PopupTab[] = [
  { label: 'Academic Dates', value: 'dates' },
  { label: 'Saved Jobs', value: 'jobs' },
  { label: 'Applications', value: 'applications' },
];

// Job list view with:
// - Job title + company
// - Location + salary
// - Application status
// - Quick actions: Apply Now, Save, Remove
```

### Phase 7: Testing & Safety

**Important Considerations:**

1. **Rate Limiting**: Prevent spamming applications
   ```typescript
   const APPLICATION_DELAY = 5000; // 5 seconds between applications
   const MAX_APPLICATIONS_PER_DAY = 50;
   ```

2. **User Confirmation**: Add confirmation prompts
   ```typescript
   if (settings.requireConfirmation) {
     const confirmed = confirm(`Apply to ${job.title} at ${job.company}?`);
     if (!confirmed) return;
   }
   ```

3. **Error Handling**: Robust error handling for failed applications
   ```typescript
   try {
     await autoApply(job);
   } catch (error) {
     updateJobStatus(job.id, 'error');
     notifyUser(`Failed to apply to ${job.title}: ${error.message}`);
   }
   ```

4. **Privacy**: Never send data to external servers without consent
   - All data stays in Chrome local storage
   - User controls what's scraped
   - Clear privacy policy

5. **Terms of Service**:
   - ⚠️ **WARNING**: Automated applications may violate platform ToS
   - Add disclaimer in extension
   - Recommend "one-click" mode over "fully automated"
   - User assumes all risk

## Implementation Priority

**Phase 1** (Immediate):
1. Finish remaining scrapers
2. Test each scraper on live platforms
3. Add scraper registry

**Phase 2** (Week 1):
1. Update content script for job detection
2. Integrate scrapers with content script
3. Test end-to-end scraping

**Phase 3** (Week 2):
1. Create options page
2. Implement user profile system
3. Add profile UI

**Phase 4** (Week 3):
1. Implement auto-fill logic
2. Test on multiple platforms
3. Handle edge cases

**Phase 5** (Week 4):
1. Implement auto-apply (with safety measures)
2. Add rate limiting
3. Comprehensive testing

**Phase 6** (Week 5):
1. Update popup UI
2. Add job management features
3. Polish UX

## Security & Legal Warnings

⚠️ **IMPORTANT WARNINGS:**

1. **Automated Applications**: Many job platforms prohibit automated submissions in their Terms of Service. Using this feature may:
   - Violate platform ToS
   - Result in account suspension
   - Blacklist from future applications

2. **Recommendation**: Use "Form Assistance" mode instead of "Fully Automated"
   - Extension fills in fields
   - User reviews before submitting
   - Stays compliant with ToS

3. **Data Privacy**:
   - All data stored locally in browser
   - No external API calls (except if using AI generation later)
   - User controls all data

4. **Testing**:
   - Test extensively before live use
   - Start with "save only" mode
   - Gradually enable automation

## Next Steps

To continue implementation:

1. Run `npm run dev` to start development build
2. Implement remaining scrapers in `src/scrapers/`
3. Test each platform individually
4. Build incrementally, testing at each phase
5. Add safety measures before enabling auto-apply

## Documentation Updates Needed

- Update README.md with job automation features
- Create user guide for setting up profile
- Add troubleshooting for each platform
- Document safety best practices

---

**Note**: This is a significant expansion of the extension. Recommend implementing in phases and testing thoroughly at each step.
