export { }; // Ensure it's treated as a module

chrome.runtime.onInstalled.addListener(() => {
    console.log("ChatGPT API Helper Background Service Worker Installed");
});

// Relay "Toggle UI" from Popup to Content Script
// This acts as a bridge: Popup -> Background -> Content Script
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_UI" });
    }
});
