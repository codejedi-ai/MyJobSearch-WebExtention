import { h } from 'preact';
import { useState } from 'preact/hooks';
import './style.css';

export function PopupApp() {
  const [currentJSON, setCurrentJSON] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');

  const showStatus = (message: string, type: string = 'info') => {
    setStatus(message);
    setStatusType(type);
    if (type !== 'error') {
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const extractPageData = async () => {
    setLoading(true);
    showStatus('Extracting page data...', 'info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        showStatus('No active tab found', 'error');
        setLoading(false);
        return;
      }

      console.log('Sending EXTRACT_PAGE_DATA to tab:', tab.id);

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE_DATA' });

      if (response && response.success) {
        setCurrentJSON(response.data);
        showStatus('✅ Page data extracted successfully!', 'success');
      } else {
        showStatus(`Failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      if (error?.message?.includes('Receiving end does not exist')) {
        showStatus('❌ Content script not ready. Try refreshing the page.', 'error');
      } else if (error?.message?.includes('Extension context invalidated')) {
        showStatus('❌ Extension was updated. Please refresh the page.', 'error');
      } else {
        showStatus(`Error: ${error?.message || 'Failed to extract data'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!currentJSON) return;

    try {
      const jsonString = JSON.stringify(currentJSON, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showStatus('✅ JSON copied to clipboard!', 'success');
    } catch (error) {
      showStatus('Failed to copy to clipboard', 'error');
    }
  };

  const downloadJSON = async () => {
    if (!currentJSON) return;

    showStatus('Downloading...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_JSON',
        data: currentJSON
      });

      if (response && response.success) {
        showStatus('✅ Download started!', 'success');
      } else {
        showStatus(`Download failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showStatus(`Error: ${(error as any)?.message || 'Unknown error'}`, 'error');
    }
  };

  const jsonPreview = currentJSON
    ? JSON.stringify(currentJSON, null, 2).slice(0, 500) + '...'
    : 'Click "Extract" to see preview...';

  return (
    <div class="container" data-component="popup-main-container" data-testid="popup-container">
      <h1 data-component="popup-title" data-testid="popup-title">🌐 Webpage to JSON</h1>

      {status && (
        <div 
          class={`status status-${statusType}`}
          data-component="status-message"
          data-status-type={statusType}
          data-testid={`status-${statusType}`}
        >
          {status}
        </div>
      )}

      <div class="controls" data-component="controls-section" data-testid="controls">
        <button 
          onClick={extractPageData} 
          disabled={loading}
          class="btn primary"
          data-action="extract-page-data"
          data-testid="btn-extract"
          data-loading={loading}
        >
          📄 Extract Current Page
        </button>
        <button 
          onClick={copyToClipboard}
          disabled={!currentJSON}
          class="btn secondary"
          data-action="copy-to-clipboard"
          data-testid="btn-copy"
          data-enabled={!!currentJSON}
        >
          📋 Copy JSON
        </button>
        <button 
          onClick={downloadJSON}
          disabled={!currentJSON}
          class="btn secondary"
          data-action="download-json"
          data-testid="btn-download"
          data-enabled={!!currentJSON}
        >
          💾 Download JSON
        </button>
      </div>

      <div class="preview" data-component="preview-section" data-testid="preview">
        <h3 data-component="preview-title" data-testid="preview-title">JSON Preview (first 500 chars):</h3>
        <pre 
          data-component="json-preview"
          data-testid="json-preview"
          data-json-available={!!currentJSON}
        >
          {jsonPreview}
        </pre>
      </div>

      <div class="info" data-component="info-section" data-testid="info">
        <details data-component="collapsible-info" data-testid="collapsible-info">
          <summary data-component="info-summary" data-testid="info-toggle">ℹ️ What's extracted?</summary>
          <ul data-component="extraction-list" data-testid="extraction-list">
            <li data-extraction-item="metadata">Page metadata (title, URL, description)</li>
            <li data-extraction-item="headings">Headings (H1, H2, H3)</li>
            <li data-extraction-item="paragraphs">Paragraphs (first 50)</li>
            <li data-extraction-item="links">Links (first 100)</li>
            <li data-extraction-item="images">Images (first 50)</li>
            <li data-extraction-item="meta-tags">Meta tags and scripts</li>
            <li data-extraction-item="text-content">Text content (first 10k chars)</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
