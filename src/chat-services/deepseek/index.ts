// DeepSeek chat service implementation

import { BaseChatService } from '../base';
import { ChatPlatform } from '../types';
import {
  DEEPSEEK_SELECTORS,
  findElement,
  findAllElements,
  matchesAny,
} from './selectors';
import { createNativeStyledButton } from './styles';

export class DeepSeekService extends BaseChatService {
  name: ChatPlatform = 'deepseek';
  hostPatterns = [/^chat\.deepseek\.com$/];

  getChatContainer(): HTMLElement | null {
    // Find the main chat container for MutationObserver
    const container = findElement(DEEPSEEK_SELECTORS.chatContainer);
    if (container) {
      console.log('[DeepSeek] Found chat container:', container.className);
    }
    return container;
  }

  getMessageContainers(): HTMLElement[] {
    // Find all assistant message containers
    const containers = findAllElements(DEEPSEEK_SELECTORS.assistantMessage);

    // Filter out user messages if our selector caught them
    const filtered = containers.filter(
      (el) => !matchesAny(el, DEEPSEEK_SELECTORS.userMessage)
    );

    console.log(
      `[DeepSeek] Found ${filtered.length} assistant message containers`
    );
    return filtered;
  }

  getActionButtonContainer(messageContainer: HTMLElement): HTMLElement | null {
    // First, look within the message container
    let buttonContainer = findElement(
      DEEPSEEK_SELECTORS.actionButtons,
      messageContainer
    );

    if (buttonContainer) {
      console.log(
        '[DeepSeek] Found action buttons inside message:',
        buttonContainer.className
      );
      return buttonContainer;
    }

    // If not found inside, check siblings (some UIs put buttons outside message)
    const parent = messageContainer.parentElement;
    if (parent) {
      buttonContainer = findElement(DEEPSEEK_SELECTORS.actionButtons, parent);
      if (buttonContainer && buttonContainer !== messageContainer) {
        console.log(
          '[DeepSeek] Found action buttons in parent:',
          buttonContainer.className
        );
        return buttonContainer;
      }
    }

    // Try to find the copy button and use its parent as the container
    const copyButton = this.findCopyButton(messageContainer);
    if (copyButton?.parentElement) {
      console.log(
        '[DeepSeek] Using copy button parent as container:',
        copyButton.parentElement.className
      );
      return copyButton.parentElement;
    }

    console.log('[DeepSeek] Could not find action button container');
    return null;
  }

  isMessageStreaming(container: HTMLElement): boolean {
    // Check for streaming indicators within the message
    const indicator = findElement(
      DEEPSEEK_SELECTORS.streamingIndicator,
      container
    );

    // Also check for cursor-like elements that appear during typing
    if (indicator) {
      return true;
    }

    // Check if parent or nearby elements have streaming class
    const parent = container.parentElement;
    if (parent) {
      const parentIndicator = findElement(
        DEEPSEEK_SELECTORS.streamingIndicator,
        parent
      );
      if (parentIndicator) {
        return true;
      }
    }

    return false;
  }

  extractMarkdown(container: HTMLElement): string {
    // First, try to find raw markdown content if stored in data attributes
    const rawContent =
      container.getAttribute('data-raw-content') ||
      container.getAttribute('data-content') ||
      container.getAttribute('data-markdown');

    if (rawContent) {
      console.log('[DeepSeek] Found raw markdown in data attribute');
      return rawContent;
    }

    // Find the content area within the message
    let contentElement = findElement(
      DEEPSEEK_SELECTORS.messageContent,
      container
    );

    // If no specific content area found, use the container itself
    if (!contentElement) {
      contentElement = container;
    }

    // Convert HTML to markdown
    const markdown = this.htmlToMarkdown(contentElement);

    // Clean up the markdown
    return this.cleanMarkdown(markdown);
  }

  createStyledButton(): HTMLElement {
    // Try to find an existing copy button to clone styling from
    const copyButton = this.findCopyButtonOnPage();
    return createNativeStyledButton(copyButton);
  }

  private findCopyButton(container: HTMLElement): HTMLElement | null {
    // Find copy button within or near a specific message
    return (
      findElement(DEEPSEEK_SELECTORS.copyButton, container) ||
      findElement(
        DEEPSEEK_SELECTORS.copyButton,
        container.parentElement || container
      )
    );
  }

  private findCopyButtonOnPage(): HTMLElement | null {
    // Find any copy button on the page to clone styling
    return findElement(DEEPSEEK_SELECTORS.copyButton);
  }

  private cleanMarkdown(markdown: string): string {
    return (
      markdown
        // Remove excessive blank lines
        .replace(/\n{3,}/g, '\n\n')
        // Trim leading/trailing whitespace
        .trim()
    );
  }
}
