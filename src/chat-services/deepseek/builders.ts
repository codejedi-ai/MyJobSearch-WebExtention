// Button builder pattern for DeepSeek chat service

import { getSendIcon, createNativeStyledButton } from './styles';

export interface ButtonClickContext {
  messageContainer: HTMLElement;
  content: string;
  platform: string;
  sourceUrl: string;
  timestamp: string;
}

type ButtonClickHandler = (context: ButtonClickContext) => void;

/**
 * Button builder for creating styled action buttons
 */
export class ButtonBuilder {
  private button: HTMLButtonElement;
  private referenceButton: HTMLElement | null;

  constructor(referenceButton: HTMLElement | null) {
    this.referenceButton = referenceButton;
    this.button = createNativeStyledButton(referenceButton);
  }

  withTitle(title: string): this {
    this.button.setAttribute('title', title);
    this.button.setAttribute('aria-label', title);
    return this;
  }

  withIcon(iconHtml: string): this {
    this.button.innerHTML = iconHtml;
    const svg = this.button.querySelector('svg');
    if (svg) {
      svg.style.display = 'block';
    }
    return this;
  }

  withId(id: string): this {
    this.button.setAttribute('data-ext-button-id', id);
    return this;
  }

  build(): HTMLButtonElement {
    return this.button;
  }
}

/**
 * Director for building common button configurations
 */
export class ButtonDirector {
  private referenceButton: HTMLElement | null;

  constructor(referenceButton: HTMLElement | null) {
    this.referenceButton = referenceButton;
  }

  buildSendToExtensionButton(onClick: ButtonClickHandler): HTMLButtonElement {
    const builder = new ButtonBuilder(this.referenceButton);
    return builder
      .withTitle('Send to Extension')
      .withIcon(getSendIcon())
      .withId('send-to-extension')
      .build();
  }

  buildSendToDeepSeekButton(onClick: ButtonClickHandler): HTMLButtonElement {
    const builder = new ButtonBuilder(this.referenceButton);
    return builder
      .withTitle('Send to DeepSeek Input')
      .withIcon(getInputIcon())
      .withId('send-to-deepseek')
      .build();
  }
}

/**
 * Create a button director with reference styling
 */
export function createButtonDirector(referenceButton: HTMLElement | null): ButtonDirector {
  return new ButtonDirector(referenceButton);
}

/**
 * Icon for "send to input" action
 */
function getInputIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="15" y2="10"/>
    </svg>
  `;
}
