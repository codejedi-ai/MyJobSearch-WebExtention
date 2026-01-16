// Button Builder using the Builder Design Pattern
// Allows flexible construction of styled buttons for DeepSeek chat interface

import { getIcon, IconType } from '../icons';

export interface ButtonConfig {
  id: string;
  icon: IconType;
  tooltip: string;
  ariaLabel: string;
  onClick: (messageContainer: HTMLElement, content: string) => void;
}

export interface ButtonStyles {
  display: string;
  alignItems: string;
  justifyContent: string;
  padding: string;
  margin: string;
  border: string;
  borderRadius: string;
  background: string;
  color: string;
  cursor: string;
  opacity: string;
  transition: string;
}

const DEFAULT_STYLES: ButtonStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  margin: '0 2px',
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  opacity: '0.7',
  transition: 'background-color 0.2s, color 0.2s, opacity 0.2s',
};

/**
 * ButtonBuilder - Implements the Builder pattern for creating DeepSeek action buttons
 *
 * Usage:
 *   const button = new ButtonBuilder()
 *     .setId('send-deepseek')
 *     .setIcon('deepseek')
 *     .setTooltip('Send to DeepSeek')
 *     .setAriaLabel('Send message to DeepSeek')
 *     .setOnClick((container, content) => { ... })
 *     .build();
 */
export class ButtonBuilder {
  private id: string = '';
  private icon: IconType = 'send';
  private tooltip: string = '';
  private ariaLabel: string = '';
  private onClick: ((messageContainer: HTMLElement, content: string) => void) | null = null;
  private referenceButton: HTMLElement | null = null;
  private customStyles: Partial<ButtonStyles> = {};
  private hoverStyles: Partial<ButtonStyles> = {};

  /**
   * Set the button's unique identifier
   */
  setId(id: string): ButtonBuilder {
    this.id = id;
    return this;
  }

  /**
   * Set the icon type for the button
   */
  setIcon(icon: IconType): ButtonBuilder {
    this.icon = icon;
    return this;
  }

  /**
   * Set the tooltip text shown on hover
   */
  setTooltip(tooltip: string): ButtonBuilder {
    this.tooltip = tooltip;
    return this;
  }

  /**
   * Set the aria-label for accessibility
   */
  setAriaLabel(ariaLabel: string): ButtonBuilder {
    this.ariaLabel = ariaLabel;
    return this;
  }

  /**
   * Set the click handler that receives the message container and extracted content
   */
  setOnClick(handler: (messageContainer: HTMLElement, content: string) => void): ButtonBuilder {
    this.onClick = handler;
    return this;
  }

  /**
   * Set a reference button to clone styles from (for native look)
   */
  setReferenceButton(button: HTMLElement | null): ButtonBuilder {
    this.referenceButton = button;
    return this;
  }

  /**
   * Set custom styles to override defaults
   */
  setStyles(styles: Partial<ButtonStyles>): ButtonBuilder {
    this.customStyles = { ...this.customStyles, ...styles };
    return this;
  }

  /**
   * Set hover state styles
   */
  setHoverStyles(styles: Partial<ButtonStyles>): ButtonBuilder {
    this.hoverStyles = { ...this.hoverStyles, ...styles };
    return this;
  }

  /**
   * Build the final button element
   */
  build(): HTMLButtonElement {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('data-ext-button-id', this.id);

    if (this.tooltip) {
      button.setAttribute('title', this.tooltip);
    }

    if (this.ariaLabel) {
      button.setAttribute('aria-label', this.ariaLabel);
    }

    // Apply styles - either from reference button or defaults
    this.applyStyles(button);

    // Set the icon
    button.innerHTML = getIcon(this.icon);

    // Ensure SVG inherits color
    const svg = button.querySelector('svg');
    if (svg) {
      svg.style.display = 'block';
    }

    // Add hover effects
    this.addHoverEffects(button);

    return button;
  }

  /**
   * Build the button with its click handler attached
   */
  buildWithHandler(messageContainer: HTMLElement, contentExtractor: () => string): HTMLButtonElement {
    const button = this.build();

    if (this.onClick) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const content = contentExtractor();
        this.onClick!(messageContainer, content);
      });
    }

    return button;
  }

  private applyStyles(button: HTMLButtonElement): void {
    if (this.referenceButton) {
      // Clone classes from reference button
      button.className = this.referenceButton.className;

      // Copy inline styles if any
      const refStyle = this.referenceButton.getAttribute('style');
      if (refStyle) {
        button.setAttribute('style', refStyle);
      }

      // Copy key computed styles for consistency
      const computed = window.getComputedStyle(this.referenceButton);
      const importantStyles = [
        'display', 'alignItems', 'justifyContent', 'padding', 'margin',
        'border', 'borderRadius', 'background', 'backgroundColor', 'color',
        'cursor', 'fontSize', 'lineHeight', 'width', 'height',
        'minWidth', 'minHeight', 'gap',
      ];

      const styleOverrides: string[] = [];
      importantStyles.forEach((prop) => {
        const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        const value = computed.getPropertyValue(cssProperty);
        if (value && value !== 'none' && value !== 'auto') {
          styleOverrides.push(`${cssProperty}: ${value}`);
        }
      });

      if (styleOverrides.length > 0) {
        button.style.cssText = styleOverrides.join('; ');
      }
    } else {
      // Apply default + custom styles
      const finalStyles = { ...DEFAULT_STYLES, ...this.customStyles };
      const cssText = Object.entries(finalStyles)
        .map(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${cssKey}: ${value}`;
        })
        .join('; ');
      button.style.cssText = cssText;
    }
  }

  private addHoverEffects(button: HTMLButtonElement): void {
    const originalOpacity = button.style.opacity || '0.7';
    const originalBackground = button.style.backgroundColor || 'transparent';

    button.addEventListener('mouseenter', () => {
      button.style.opacity = this.hoverStyles.opacity || '1';
      button.style.backgroundColor = this.hoverStyles.background || 'rgba(255, 255, 255, 0.1)';
      if (this.referenceButton) {
        button.style.filter = 'brightness(1.2)';
      }
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = originalOpacity;
      button.style.backgroundColor = originalBackground;
      if (this.referenceButton) {
        button.style.filter = 'none';
      }
    });
  }

  /**
   * Reset the builder to initial state
   */
  reset(): ButtonBuilder {
    this.id = '';
    this.icon = 'send';
    this.tooltip = '';
    this.ariaLabel = '';
    this.onClick = null;
    this.referenceButton = null;
    this.customStyles = {};
    this.hoverStyles = {};
    return this;
  }
}
