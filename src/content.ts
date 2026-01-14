console.log('Content script loaded on:', window.location.href);

function extractPageData() {
  // Extract different parts of the page
  const pageData = {
    metadata: {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
      author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
      language: document.documentElement.lang || document.querySelector('html')?.getAttribute('lang') || '',
      timestamp: new Date().toISOString()
    },
    
    structure: {
      doctype: document.doctype?.name || 'html',
      tags: {
        h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean),
        h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean),
        h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim()).filter(Boolean),
        paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean).slice(0, 50),
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.href,
          title: a.title
        })).slice(0, 100),
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        })).slice(0, 50)
      }
    },
    
    content: {
      textContent: (document.body?.innerText || '').slice(0, 10000),
      html: document.documentElement.outerHTML.slice(0, 5000)
    },
    
    head: {
      meta: Array.from(document.querySelectorAll('meta')).map(meta => ({
        name: meta.getAttribute('name'),
        property: meta.getAttribute('property'),
        content: meta.getAttribute('content'),
        charset: meta.getAttribute('charset')
      })).filter(m => m.name || m.property),
      links: Array.from(document.querySelectorAll('link')).map(link => ({
        rel: link.rel,
        href: link.href,
        type: link.type
      })),
      scripts: Array.from(document.querySelectorAll('script')).map(script => ({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer
      })).filter((s: any) => s.src)
    }
  };
  
  return pageData;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message.type);
  
  if (message.type === 'EXTRACT_PAGE_DATA') {
    try {
      const data = extractPageData();
      console.log('Extracted page data:', data);
      sendResponse({ success: true, data: data });
    } catch (error) {
      console.error('Error extracting page data:', error);
      sendResponse({ success: false, error: (error as Error)?.message || 'Unknown error' });
    }
  }
  return true;
});

console.log('Content script listener registered for:', window.location.href);
