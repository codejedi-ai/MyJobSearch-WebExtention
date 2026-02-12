document.addEventListener('DOMContentLoaded', async () => {
    const promptArea = document.getElementById('system-prompt') as unknown as HTMLTextAreaElement;
    const uuidLabel = document.getElementById('chat-uuid');
    const saveStatus = document.getElementById('save-status');

    // 1. Get the Active Tab URL to determine the Chat UUID
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || (!tab.url.includes('chatgpt.com') && !tab.url.includes('openai.com'))) {
        uuidLabel.innerText = "No active ChatGPT tab found";
        uuidLabel.style.color = "#ef4444";
        promptArea.disabled = true;
        promptArea.placeholder = "Please open a ChatGPT conversation to set a system prompt.";
        return;
    }

    // Extract UUID
    const getUuid = (url) => (url.match(/\/c\/([a-f0-9-]{36})/) || [])[1] || 'default';
    const currentUuid = getUuid(tab.url);

    uuidLabel.innerText = `Chat ID: ${currentUuid}`;

    // 2. Load Existing Prompt from Storage
    const storageKey = `prompt_${currentUuid}`;
    chrome.storage.local.get(storageKey, (data) => {
        promptArea.value = data[storageKey] || '';
    });

    // 3. Save Logic
    let timeout;
    promptArea.addEventListener('input', () => {
        // Optimistic UI Update
        saveStatus.style.opacity = '1';
        saveStatus.innerText = 'Saving...';
        saveStatus.style.color = '#eab308'; // Yellow

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const val = promptArea.value;

            // Save to Chrome Storage
            chrome.storage.local.set({ [storageKey]: val }, () => {
                saveStatus.innerText = 'Saved';
                saveStatus.style.color = '#10a37f'; // Green
                setTimeout(() => { saveStatus.style.opacity = '0'; }, 1500);

                // Optional: Notify content script just in case it needs instant refresh (though it watches storage/URL too)
                if (tab.id) chrome.tabs.sendMessage(tab.id, { action: "PROMPT_UPDATED", prompt: val });
            });
        }, 500); // Debounce save
    });
});
