// DOM selectors for DeepSeek chat interface
// Note: These selectors may need adjustment based on actual DOM inspection

export const DEEPSEEK_SELECTORS = {
  // Chat container - the main scrollable area containing messages
  // Try multiple selectors in order of specificity
  chatContainer: [
    '[class*="chat-container"]',
    '[class*="conversation"]',
    '[class*="messages"]',
    'main',
    '#__next main',
    '[role="main"]',
  ],

  // Assistant message containers - messages from the AI
  // DeepSeek likely uses data attributes or class names to identify roles
  assistantMessage: [
    '[data-role="assistant"]',
    '[class*="assistant"]',
    '[class*="bot-message"]',
    '[class*="ai-message"]',
    '[class*="response"]',
    '.message:not([data-role="user"])',
  ],

  // User message containers (for filtering)
  userMessage: [
    '[data-role="user"]',
    '[class*="user-message"]',
    '[class*="human-message"]',
  ],

  // Action buttons container - where copy, like, etc. buttons live
  actionButtons: [
    '[class*="action"]',
    '[class*="toolbar"]',
    '[class*="buttons"]',
    '[class*="controls"]',
    '[class*="message-footer"]',
    '[class*="operations"]',
  ],

  // Copy button specifically - to clone styling from
  copyButton: [
    'button[class*="copy"]',
    'button[aria-label*="copy" i]',
    'button[title*="Copy" i]',
    'button[data-action="copy"]',
    '[class*="copy-button"]',
    'button svg[class*="copy"]',
  ],

  // Streaming/loading indicators
  streamingIndicator: [
    '[class*="loading"]',
    '[class*="typing"]',
    '[class*="streaming"]',
    '[class*="generating"]',
    '[class*="thinking"]',
    '[class*="cursor"]',
    '.animate-pulse',
    '[class*="dot-flashing"]',
  ],

  // Message content area - where the actual text/markdown is rendered
  messageContent: [
    '[class*="content"]',
    '[class*="markdown"]',
    '[class*="prose"]',
    '[class*="message-body"]',
    '[class*="message-text"]',
  ],
};

/**
 * Find an element using multiple selector options
 * Returns the first match found
 */
export function findElement(
  selectors: string[],
  parent: Element | Document = document
): HTMLElement | null {
  for (const selector of selectors) {
    try {
      const element = parent.querySelector(selector);
      if (element) {
        return element as HTMLElement;
      }
    } catch (e) {
      // Invalid selector, skip
      console.warn(`[Extension] Invalid selector: ${selector}`);
    }
  }
  return null;
}

/**
 * Find all elements matching any of the selectors
 */
export function findAllElements(
  selectors: string[],
  parent: Element | Document = document
): HTMLElement[] {
  const results = new Set<HTMLElement>();

  for (const selector of selectors) {
    try {
      const elements = parent.querySelectorAll(selector);
      elements.forEach((el) => results.add(el as HTMLElement));
    } catch (e) {
      // Invalid selector, skip
    }
  }

  return Array.from(results);
}

/**
 * Check if an element matches any of the selectors
 */
export function matchesAny(element: Element, selectors: string[]): boolean {
  for (const selector of selectors) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (e) {
      // Invalid selector, skip
    }
  }
  return false;
}
