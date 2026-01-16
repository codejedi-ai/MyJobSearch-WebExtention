// Base class for AI chat service integrations

import { ChatServiceInterface, ChatPlatform, ChatMessage } from './types';

const INJECTED_MARKER = 'data-ext-send-injected';

export abstract class BaseChatService implements ChatServiceInterface {
  abstract name: ChatPlatform;
  abstract hostPatterns: RegExp[];

  private observer: MutationObserver | null = null;
  private checkIntervals: Map<HTMLElement, number> = new Map();

  abstract getMessageContainers(): HTMLElement[];
  abstract extractMarkdown(container: HTMLElement): string;
  abstract getActionButtonContainer(messageContainer: HTMLElement): HTMLElement | null;
  abstract isMessageStreaming(container: HTMLElement): boolean;
  abstract getChatContainer(): HTMLElement | null;
  abstract createStyledButton(): HTMLElement;

  initialize(): void {
    console.log(`[Extension] Initializing ${this.name} chat service`);
    this.setupMutationObserver();
    // Delay initial injection to ensure DOM is ready
    setTimeout(() => this.injectIntoExistingMessages(), 1000);
  }

  destroy(): void {
    console.log(`[Extension] Destroying ${this.name} chat service`);
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    // Clear all pending intervals
    this.checkIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.checkIntervals.clear();
  }

  protected injectIntoExistingMessages(): void {
    const containers = this.getMessageContainers();
    console.log(`[Extension] Found ${containers.length} existing message containers`);
    containers.forEach((container) => this.tryInjectButton(container));
  }

  protected setupMutationObserver(): void {
    const chatContainer = this.getChatContainer();
    if (!chatContainer) {
      console.warn('[Extension] Chat container not found, retrying in 2s...');
      setTimeout(() => this.setupMutationObserver(), 2000);
      return;
    }

    console.log('[Extension] Setting up MutationObserver on chat container');

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              this.handleAddedNode(node);
            }
          });
        }
      }
    });

    this.observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });
  }

  protected handleAddedNode(node: HTMLElement): void {
    // Check if this node is a message container
    if (this.isMessageContainer(node)) {
      this.waitForMessageComplete(node);
      return;
    }

    // Search within the node for message containers
    const containers = this.getMessageContainersWithin(node);
    containers.forEach((container) => this.waitForMessageComplete(container));
  }

  protected isMessageContainer(node: HTMLElement): boolean {
    const containers = this.getMessageContainers();
    return containers.includes(node);
  }

  protected getMessageContainersWithin(node: HTMLElement): HTMLElement[] {
    // Get all message containers and filter to those within this node
    const allContainers = this.getMessageContainers();
    return allContainers.filter(
      (container) => node.contains(container) || node === container
    );
  }

  protected waitForMessageComplete(container: HTMLElement): void {
    // If already injected, skip
    if (container.hasAttribute(INJECTED_MARKER)) {
      return;
    }

    // If not streaming, inject immediately
    if (!this.isMessageStreaming(container)) {
      this.tryInjectButton(container);
      return;
    }

    // Poll until streaming completes
    const intervalId = window.setInterval(() => {
      if (!this.isMessageStreaming(container)) {
        clearInterval(intervalId);
        this.checkIntervals.delete(container);
        this.tryInjectButton(container);
      }
    }, 500);

    this.checkIntervals.set(container, intervalId);

    // Timeout after 60 seconds
    setTimeout(() => {
      if (this.checkIntervals.has(container)) {
        clearInterval(this.checkIntervals.get(container));
        this.checkIntervals.delete(container);
        this.tryInjectButton(container);
      }
    }, 60000);
  }

  protected tryInjectButton(messageContainer: HTMLElement): void {
    // Check if already injected
    if (messageContainer.hasAttribute(INJECTED_MARKER)) {
      return;
    }

    const buttonContainer = this.getActionButtonContainer(messageContainer);
    if (!buttonContainer) {
      console.log('[Extension] Action button container not found for message');
      return;
    }

    const button = this.createStyledButton();
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleButtonClick(messageContainer);
    });

    buttonContainer.appendChild(button);
    messageContainer.setAttribute(INJECTED_MARKER, 'true');
    console.log('[Extension] Injected send button into message');
  }

  protected handleButtonClick(messageContainer: HTMLElement): void {
    const markdown = this.extractMarkdown(messageContainer);

    const message: ChatMessage = {
      platform: this.name,
      role: 'assistant',
      content: markdown,
      timestamp: new Date().toISOString(),
      sourceUrl: window.location.href,
    };

    // For now, just log to console
    console.log('[Extension] Extracted message:', message);
    console.log('[Extension] Markdown content:\n', markdown);

    // Visual feedback
    this.showFeedback(messageContainer, 'Message captured!');
  }

  protected showFeedback(container: HTMLElement, text: string): void {
    const feedback = document.createElement('div');
    feedback.textContent = text;
    feedback.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeInOut 2s ease-in-out forwards;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(feedback);
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 2000);
  }

  // Utility method to convert HTML to markdown
  protected htmlToMarkdown(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove any injected buttons
    clone.querySelectorAll(`[${INJECTED_MARKER}]`).forEach((el) => el.remove());

    return this.convertNodeToMarkdown(clone);
  }

  private convertNodeToMarkdown(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes)
      .map((child) => this.convertNodeToMarkdown(child))
      .join('');

    switch (tagName) {
      case 'h1':
        return `# ${children}\n\n`;
      case 'h2':
        return `## ${children}\n\n`;
      case 'h3':
        return `### ${children}\n\n`;
      case 'h4':
        return `#### ${children}\n\n`;
      case 'h5':
        return `##### ${children}\n\n`;
      case 'h6':
        return `###### ${children}\n\n`;
      case 'p':
        return `${children}\n\n`;
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'code':
        // Check if inside a pre (code block)
        if (element.parentElement?.tagName.toLowerCase() === 'pre') {
          return children;
        }
        return `\`${children}\``;
      case 'pre':
        const codeEl = element.querySelector('code');
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || '';
        const codeContent = codeEl?.textContent || element.textContent || '';
        return `\`\`\`${lang}\n${codeContent}\n\`\`\`\n\n`;
      case 'a':
        const href = element.getAttribute('href') || '';
        return `[${children}](${href})`;
      case 'ul':
        return children + '\n';
      case 'ol':
        return children + '\n';
      case 'li':
        const parent = element.parentElement;
        if (parent?.tagName.toLowerCase() === 'ol') {
          const index =
            Array.from(parent.children).indexOf(element as Element) + 1;
          return `${index}. ${children}\n`;
        }
        return `- ${children}\n`;
      case 'blockquote':
        return (
          children
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n') + '\n\n'
        );
      case 'hr':
        return '---\n\n';
      case 'img':
        const alt = element.getAttribute('alt') || '';
        const src = element.getAttribute('src') || '';
        return `![${alt}](${src})`;
      case 'table':
        return this.convertTableToMarkdown(element);
      case 'div':
      case 'span':
      case 'section':
      case 'article':
        return children;
      default:
        return children;
    }
  }

  private convertTableToMarkdown(table: HTMLElement): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const result: string[] = [];

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const cellContents = cells.map((cell) =>
        this.convertNodeToMarkdown(cell).trim().replace(/\n/g, ' ')
      );
      result.push(`| ${cellContents.join(' | ')} |`);

      // Add header separator after first row if it contains th elements
      if (rowIndex === 0 && row.querySelector('th')) {
        result.push(`| ${cells.map(() => '---').join(' | ')} |`);
      }
    });

    return result.join('\n') + '\n\n';
  }
}
