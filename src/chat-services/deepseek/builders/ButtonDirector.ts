// Button Director - Pre-configured button builders for common use cases
// Part of the Builder Design Pattern implementation

import { ButtonBuilder } from './ButtonBuilder';

export interface ButtonClickContext {
  messageContainer: HTMLElement;
  content: string;
  platform: string;
  sourceUrl: string;
  timestamp: string;
}

export type ButtonClickHandler = (context: ButtonClickContext) => void | Promise<void>;

/**
 * ButtonDirector - Provides pre-configured button builders
 *
 * The Director class defines the order in which to execute building steps.
 * It allows creation of specific button configurations using the same building process.
 */
export class ButtonDirector {
  private builder: ButtonBuilder;
  private referenceButton: HTMLElement | null = null;

  constructor(builder?: ButtonBuilder) {
    this.builder = builder || new ButtonBuilder();
  }

  /**
   * Set a reference button for style cloning
   */
  setReferenceButton(button: HTMLElement | null): ButtonDirector {
    this.referenceButton = button;
    return this;
  }

  /**
   * Get the underlying builder for custom configurations
   */
  getBuilder(): ButtonBuilder {
    return this.builder;
  }

  /**
   * Create a "Send to Extension" button
   * Captures the message content and sends it to the extension
   */
  buildSendToExtensionButton(onSend: ButtonClickHandler): HTMLButtonElement {
    return this.builder
      .reset()
      .setId('ext-send-to-extension')
      .setIcon('send')
      .setTooltip('Send to Extension')
      .setAriaLabel('Send message to extension')
      .setReferenceButton(this.referenceButton)
      .setOnClick((container, content) => {
        onSend({
          messageContainer: container,
          content,
          platform: 'deepseek',
          sourceUrl: window.location.href,
          timestamp: new Date().toISOString(),
        });
      })
      .build();
  }

  /**
   * Create a "Send to DeepSeek" button
   * Extracts content and sends it to DeepSeek for processing
   */
  buildSendToDeepSeekButton(onSend: ButtonClickHandler): HTMLButtonElement {
    return this.builder
      .reset()
      .setId('ext-send-to-deepseek')
      .setIcon('deepseek')
      .setTooltip('Send to DeepSeek')
      .setAriaLabel('Send message content to DeepSeek')
      .setReferenceButton(this.referenceButton)
      .setOnClick((container, content) => {
        onSend({
          messageContainer: container,
          content,
          platform: 'deepseek',
          sourceUrl: window.location.href,
          timestamp: new Date().toISOString(),
        });
      })
      .build();
  }

  /**
   * Create a "Download" button
   * Downloads the message content as a file
   */
  buildDownloadButton(onDownload: ButtonClickHandler): HTMLButtonElement {
    return this.builder
      .reset()
      .setId('ext-download')
      .setIcon('download')
      .setTooltip('Download content')
      .setAriaLabel('Download message content')
      .setReferenceButton(this.referenceButton)
      .setOnClick((container, content) => {
        onDownload({
          messageContainer: container,
          content,
          platform: 'deepseek',
          sourceUrl: window.location.href,
          timestamp: new Date().toISOString(),
        });
      })
      .build();
  }

  /**
   * Create a "Share" button
   * Shares the message content
   */
  buildShareButton(onShare: ButtonClickHandler): HTMLButtonElement {
    return this.builder
      .reset()
      .setId('ext-share')
      .setIcon('share')
      .setTooltip('Share content')
      .setAriaLabel('Share message content')
      .setReferenceButton(this.referenceButton)
      .setOnClick((container, content) => {
        onShare({
          messageContainer: container,
          content,
          platform: 'deepseek',
          sourceUrl: window.location.href,
          timestamp: new Date().toISOString(),
        });
      })
      .build();
  }

  /**
   * Build multiple buttons at once using an array of configurations
   */
  buildButtons(
    configs: Array<{
      type: 'sendToExtension' | 'sendToDeepSeek' | 'download' | 'share';
      handler: ButtonClickHandler;
    }>
  ): HTMLButtonElement[] {
    return configs.map((config) => {
      switch (config.type) {
        case 'sendToExtension':
          return this.buildSendToExtensionButton(config.handler);
        case 'sendToDeepSeek':
          return this.buildSendToDeepSeekButton(config.handler);
        case 'download':
          return this.buildDownloadButton(config.handler);
        case 'share':
          return this.buildShareButton(config.handler);
        default:
          throw new Error(`Unknown button type: ${config.type}`);
      }
    });
  }
}

/**
 * Factory function to create a pre-configured ButtonDirector
 */
export function createButtonDirector(referenceButton?: HTMLElement | null): ButtonDirector {
  return new ButtonDirector().setReferenceButton(referenceButton || null);
}
