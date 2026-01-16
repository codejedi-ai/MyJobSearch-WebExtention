// DOM selectors for DeepSeek chat interface
// Note: These selectors may need adjustment based on actual DOM inspection

export const DEEPSEEK_SELECTORS = {
  // Chat container - the main scrollable area containing messages
  // DeepSeek uses specific class patterns - use body as ultimate fallback
  chatContainer: [
    '#root',
    '#__next',
    '[class*="chat"]',
    '[class*="conversation"]',
    '[class*="messages"]',
    'main',
    '[role="main"]',
    // DO NOT use body - observing body kills performance
  ],

  // Assistant message containers - messages from the AI
  // DeepSeek wraps messages in divs with markdown content
  assistantMessage: [
    '[class*="ds-markdown"]',
    '[class*="markdown-body"]',
    '.markdown-body',
    '[data-role="assistant"]',
    '[class*="assistant"]',
    '[class*="bot-message"]',
    '[class*="message-content"]',
    // Generic markdown containers that might contain AI responses
    '.prose',
    '[class*="prose"]',
  ],

  // User message containers (for filtering)
  userMessage: [
    '[data-role="user"]',
    '[class*="user-message"]',
    '[class*="human-message"]',
    '[class*="user"]',
  ],

  // Action buttons container - where copy, like, etc. buttons live
  // DeepSeek puts action buttons in a row/flex container
  actionButtons: [
    '[class*="ds-flex"]',
    '[class*="action"]',
    '[class*="toolbar"]',
    '[class*="btn-group"]',
    '[class*="buttons"]',
    '[class*="controls"]',
    '[class*="operations"]',
    '[class*="message-footer"]',
    '[class*="flex"][class*="gap"]',
  ],

  // Copy button specifically - to clone styling from
  copyButton: [
    'button[class*="ds-"]',
    '[class*="ds-icon-button"]',
    'button[class*="copy"]',
    'button[aria-label*="copy" i]',
    'button[title*="Copy" i]',
    'button[data-action="copy"]',
    '[class*="copy-button"]',
    // Generic small buttons that might be action buttons
    'button[class*="icon"]',
  ],

  // Streaming/loading indicators
  streamingIndicator: [
    '[class*="loading"]',
    '[class*="typing"]',
    '[class*="streaming"]',
    '[class*="generating"]',
    '[class*="thinking"]',
    '[class*="cursor"]',
    '[class*="blink"]',
    '.animate-pulse',
    '[class*="dot-flashing"]',
    // Cursor that appears at end of streaming text
    '[class*="cursor-blink"]',
  ],

  // Message content area - where the actual text/markdown is rendered
  messageContent: [
    '[class*="ds-markdown"]',
    '[class*="markdown-body"]',
    '.markdown-body',
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
