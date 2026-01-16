// Entry point for chat service content script
// This runs on AI chat service pages

import { initializeChatService } from './index';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChatService);
} else {
  // DOM already loaded, initialize immediately
  initializeChatService();
}

console.log('[Extension] Chat services content script loaded');
