// Chat service registry and auto-detection

import { ChatServiceInterface } from './types';
import { DeepSeekService } from './deepseek';

// Register all available chat services
const services: ChatServiceInterface[] = [
  new DeepSeekService(),
  // Future services:
  // new ChatGPTService(),
  // new ClaudeService(),
  // new GeminiService(),
  // new QwenService(),
];

/**
 * Detect which chat service matches the current page
 */
export function detectChatService(): ChatServiceInterface | null {
  const hostname = window.location.hostname;

  for (const service of services) {
    if (service.hostPatterns.some((pattern) => pattern.test(hostname))) {
      return service;
    }
  }

  return null;
}

/**
 * Initialize the appropriate chat service for the current page
 */
export function initializeChatService(): void {
  const service = detectChatService();

  if (service) {
    console.log(`[Extension] Detected ${service.name} chat service`);
    service.initialize();
  } else {
    console.log('[Extension] No matching chat service for this page');
  }
}

// Re-export types and services for external use
export { ChatServiceInterface, ChatPlatform, ChatMessage } from './types';
export { DeepSeekService } from './deepseek';
