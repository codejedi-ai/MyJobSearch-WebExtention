/**
 * ChatGPT API Helper - Content Script
 * Prompt Tracker: Intercepts native sends to prepend a managed System Prompt.
 * Toggled via Popup Message (default hidden).
 */

function createPromptTrackerUI() {
    if (document.getElementById('gpt-prompt-tracker')) return;

    // 1. Create a minimal UI for managing the prompt (HIDDEN BY DEFAULT)
    const container = document.createElement('div');
    container.id = 'gpt-prompt-tracker';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: #202123;
        border: 1px solid #4d4d4f;
        border-radius: 12px;
        padding: 0;
        z-index: 9999;
        font-family: -apple-system, sans-serif;
        color: #ececf1;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        display: none; /* Hidden by default */
        overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `padding: 12px 16px; background: #2d2d30; border-bottom: 1px solid #4d4d4f; display: flex; justify-content: space-between; align-items: center;`;
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${chrome.runtime.getURL('logo.png')}" style="width: 20px; height: 20px; border-radius: 4px;">
            <span style="font-weight: 600; font-size: 13px; color: #10a37f;">System Prompt Manager</span>
        </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '×';
    closeBtn.style.cssText = `border: none; background: none; color: #acacbe; font-size: 18px; cursor: pointer; padding: 0;`;
    closeBtn.onclick = () => { container.style.display = 'none'; };
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.style.cssText = `padding: 16px;`;

    const label = document.createElement('div');
    label.innerText = 'Active System Instruction (Auto-Prepended)';
    label.style.cssText = `font-size: 11px; color: #8e8ea0; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;`;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'e.g. You are a Senior Python Developer. Always reply with code blocks...';
    textarea.style.cssText = `
        width: 100%;
        height: 100px;
        background: #343541;
        color: white;
        border: 1px solid #565869;
        border-radius: 6px;
        padding: 10px;
        font-size: 13px;
        resize: vertical;
        box-sizing: border-box;
        font-family: inherit;
        line-height: 1.4;
    `;

    body.appendChild(label);
    body.appendChild(textarea);
    container.appendChild(header);
    container.appendChild(body);
    document.body.appendChild(container);

    // Persistence Logic (Per Chat UUID)
    const getUuid = () => (window.location.pathname.match(/\/c\/([a-f0-9-]{36})/) || [])[1] || 'default';

    // Load saved prompt
    const loadPrompt = async () => {
        const uuid = getUuid();
        const data = await chrome.storage.local.get(`prompt_${uuid}`);
        textarea.value = data[`prompt_${uuid}`] || '';
    };

    // Save on input
    textarea.oninput = () => {
        chrome.storage.local.set({ [`prompt_${getUuid()}`]: textarea.value });
    };

    // Watch for URL changes to switch prompts
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            loadPrompt();
        }
    }, 1000);

    loadPrompt();

    // 2. The Native Interceptor Logic (Always Active in Background)
    const interceptAndPrepend = () => {
        const systemPrompt = textarea.value.trim();
        if (!systemPrompt) return; // Do nothing if no prompt set

        const inputField = document.getElementById('prompt-textarea');
        if (!inputField) return;

        // Get current user message (handling both innerText and value depending on GPT version)
        const userMessage = inputField.innerText || (inputField as any).value || '';
        if (!userMessage.trim()) return;

        // Prevent double injection
        if (userMessage.startsWith(`[SYSTEM PROMPT]:`)) return;

        // Construct the final message
        const finalMessage = `[SYSTEM PROMPT]: ${systemPrompt}\n\n[USER MESSAGE]: ${userMessage}`;

        // Inject back into the field
        inputField.innerText = finalMessage;
        if ('value' in inputField) (inputField as any).value = finalMessage;

        // Dispatch input event so React state updates
        const inputEvent = new Event('input', { bubbles: true });
        inputField.dispatchEvent(inputEvent);
    };

    // Attach Listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if ((e.target as HTMLElement).id === 'prompt-textarea') interceptAndPrepend();
        }
    }, true);

    document.addEventListener('mousedown', (e) => {
        const t = e.target as HTMLElement;
        if (t.closest('button[data-testid="send-button"]') || t.closest('.composer-submit-button-color')) {
            interceptAndPrepend();
        }
    }, true);

    // Listen for Toggle Message from Popup (Deprecated mostly, but good for debug)
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'TOGGLE_UI') {
            // prompt for in-page UI is deprecated in favor of popup editor
            // but we can log state
            console.log("Current System Prompt:", textarea.value);
        }
        if (request.action === 'PROMPT_UPDATED') {
            textarea.value = request.prompt;
            chrome.storage.local.set({ [`prompt_${getUuid()}`]: request.prompt });
        }
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPromptTrackerUI);
} else {
    createPromptTrackerUI();
}
