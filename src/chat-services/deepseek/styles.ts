// Native styling for DeepSeek chat interface buttons

/**
 * SVG icon for the "Send to Extension" button
 * Uses a simple export/share icon
 */
export function getSendIcon(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  `;
}

/**
 * Create a button styled to match native DeepSeek action buttons
 * Attempts to clone styling from an existing button, with fallback
 */
export function createNativeStyledButton(
  referenceButton: HTMLElement | null
): HTMLButtonElement {
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.setAttribute('title', 'Send to Extension');
  button.setAttribute('aria-label', 'Send message to extension');

  if (referenceButton) {
    // Clone classes from reference button
    button.className = referenceButton.className;

    // Copy inline styles if any
    const refStyle = referenceButton.getAttribute('style');
    if (refStyle) {
      button.setAttribute('style', refStyle);
    }

    // Also copy key computed styles to ensure consistency
    const computed = window.getComputedStyle(referenceButton);
    const importantStyles = [
      'display',
      'alignItems',
      'justifyContent',
      'padding',
      'margin',
      'border',
      'borderRadius',
      'background',
      'backgroundColor',
      'color',
      'cursor',
      'fontSize',
      'lineHeight',
      'width',
      'height',
      'minWidth',
      'minHeight',
      'gap',
    ];

    const styleOverrides: string[] = [];
    importantStyles.forEach((prop) => {
      const value = computed.getPropertyValue(
        prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      );
      if (value && value !== 'none' && value !== 'auto') {
        styleOverrides.push(
          `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
        );
      }
    });

    if (styleOverrides.length > 0) {
      button.style.cssText = styleOverrides.join('; ');
    }
  } else {
    // Fallback styling that matches common chat UI patterns
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      margin: 0 2px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
      opacity: 0.7;
    `;

    // Add hover effect via event listeners
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.7';
      button.style.backgroundColor = 'transparent';
    });
  }

  // Set the icon
  button.innerHTML = getSendIcon();

  // Ensure SVG inherits color
  const svg = button.querySelector('svg');
  if (svg) {
    svg.style.display = 'block';
  }

  return button;
}

/**
 * Apply hover effect that matches native buttons
 */
export function applyHoverEffect(
  button: HTMLButtonElement,
  referenceButton: HTMLElement | null
): void {
  if (referenceButton) {
    // Try to detect hover styles from reference
    const normalBg = window.getComputedStyle(referenceButton).backgroundColor;

    button.addEventListener('mouseenter', () => {
      // Slightly lighten/darken the background
      button.style.filter = 'brightness(1.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.filter = 'none';
    });
  }
}
