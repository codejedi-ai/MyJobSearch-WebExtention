// Chat service types for AI chat message extraction

export type ChatPlatform = 'deepseek' | 'chatgpt' | 'claude' | 'gemini' | 'qwen';

export interface ChatMessage {
  platform: ChatPlatform;
  role: 'user' | 'assistant';
  content: string; // Markdown format
  timestamp: string;
  sourceUrl: string;
  conversationId?: string;
}

export interface ButtonDefinition {
  element: HTMLButtonElement;
  id: string;
  onClick: (messageContainer: HTMLElement, content: string) => void;
}

export interface ChatServiceInterface {
  /** Service name identifier */
  name: ChatPlatform;

  /** Hostname patterns this service handles */
  hostPatterns: RegExp[];

  /** Initialize the service (set up observers, inject into existing messages) */
  initialize(): void;

  /** Clean up observers and injected elements */
  destroy(): void;

  /** Get all assistant message containers on the page */
  getMessageContainers(): HTMLElement[];

  /** Extract markdown content from a message container */
  extractMarkdown(container: HTMLElement): string;

  /** Get the container where action buttons (copy, etc.) live */
  getActionButtonContainer(messageContainer: HTMLElement): HTMLElement | null;

  /** Check if a message is still streaming */
  isMessageStreaming(container: HTMLElement): boolean;

  /** Get the main chat container element for MutationObserver */
  getChatContainer(): HTMLElement | null;

  /** Create styled buttons for injection using the builder pattern */
  createButtons(messageContainer: HTMLElement): ButtonDefinition[];

  /**
   * @deprecated Use createButtons() instead
   * Create a styled button matching the native UI
   */
  createStyledButton(): HTMLElement;
}
