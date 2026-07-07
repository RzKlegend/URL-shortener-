document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let selectedMode = 'portable'; // 'portable' or 'local'
  let redirectTimer = null;
  let qrCodeUrl = '';

  // --- UI ELEMENTS ---
  const mainApp = document.getElementById('main-app');
  const redirectionScreen = document.getElementById('redirection-screen');
  const progressIndicator = document.getElementById('progress-indicator');
  const countdownNumber = document.getElementById('countdown-number');
  const redirectTargetText = document.getElementById('redirect-target-text');
  const btnCancelRedirect = document.getElementById('btn-cancel-redirect');
  const btnForceRedirect = document.getElementById('btn-force-redirect');

  const shortenForm = document.getElementById('shorten-form');
  const longUrlInput = document.getElementById('long-url');
  const btnPaste = document.getElementById('btn-paste');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const localOptionsContainer = document.getElementById('local-options-container');
  const customAliasInput = document.getElementById('custom-alias');

  const resultBox = document.getElementById('result-box');
  const resultTypeBadge = document.getElementById('result-type-badge');
  const shortenedUrlText = document.getElementById('shortened-url-text');
  const btnCopy = document.getElementById('btn-copy');
  const btnQr = document.getElementById('btn-qr');
  const resultOriginalLink = document.getElementById('result-original-link');

  const historyCount = document.getElementById('history-count');
  const searchHistory = document.getElementById('search-history');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const historyEmptyState = document.getElementById('history-empty-state');
  const historyTableContainer = document.getElementById('history-table-container');
  const historyTableBody = document.getElementById('history-table-body');

  const qrModal = document.getElementById('qr-modal');
  const qrImage = document.getElementById('qr-image');
  const qrUrlText = document.getElementById('qr-url-text');
  const btnCloseQr = document.getElementById('btn-close-qr');
  const btnDownloadQr = document.getElementById('btn-download-qr');

  const aboutModal = document.getElementById('about-modal');
  const btnShowAbout = document.getElementById('btn-show-about');
  const btnCloseAbout = document.getElementById('btn-close-about');
  const btnCloseAboutOk = document.getElementById('btn-close-about-ok');
  
  const toastContainer = document.getElementById('toast-container');

  // --- INITIALIZATION ---
  checkHashRedirection();

  // --- REDIRECTION LOGIC ---
  function checkHashRedirection() {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash.startsWith('#c/')) {
      // Portable link
      const encoded = hash.substring(3);
      const decodedUrl = decodePortable(encoded);
      if (decodedUrl && isValidUrl(decodedUrl)) {
        startRedirection(decodedUrl);
      } else {
        showToast('Invalid or corrupted portable link', 'error');
        cleanHash();
      }
    } else if (hash.startsWith('#s/')) {
      // Stored link
      const code = hash.substring(3);
      fetch(`/api/link/${code}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          startRedirection(data.originalUrl);
        })
        .catch(err => {
          showToast('Short link not found or expired', 'error');
          cleanHash();
        });
    }
  }

  function startRedirection(targetUrl) {
    // Hide App, Show Redirection Card
    mainApp.classList.add('hidden');
    redirectionScreen.classList.remove('hidden');
    
    redirectTargetText.textContent = targetUrl;
    btnForceRedirect.onclick = () => performRedirection(targetUrl);

    // Countdown Setup
    let secondsLeft = 3;
    countdownNumber.textContent = secondsLeft;
    
    // SVG Progress Ring Animation Setup
    // r = 70 => circumference = 2 * PI * 70 = 439.82 (approx 440)
    const circumference = 2 * Math.PI * 70;
    progressIndicator.style.strokeDasharray = circumference;
    progressIndicator.style.strokeDashoffset = 0;

    let totalDuration = 3000; // 3 seconds
    let intervalTime = 50; // smooth update every 50ms
    let elapsed = 0;

    redirectTimer = setInterval(() => {
      elapsed += intervalTime;
      let ratio = elapsed / totalDuration;
      if (ratio > 1) ratio = 1;
      
      // Update stroke offset
      progressIndicator.style.strokeDashoffset = ratio * circumference;

      // Update seconds number
      let currentSecond = Math.ceil(3 - (elapsed / 1000));
      if (currentSecond < 0) currentSecond = 0;
      countdownNumber.textContent = currentSecond;

      if (elapsed >= totalDuration) {
        clearInterval(redirectTimer);
        performRedirection(targetUrl);
      }
    }, intervalTime);
  }

  function performRedirection(targetUrl) {
    clearInterval(redirectTimer);
    window.location.replace(targetUrl);
  }

  function cancelRedirection() {
    clearInterval(redirectTimer);
    redirectionScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    cleanHash();
    showToast('Redirection cancelled', 'info');
  }

  function cleanHash() {
    // Remove hash without reloading
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }

  // --- SHORTENING ALGORITHMS ---
  function encodePortable(url) {
    let prepared = url;
    if (url.startsWith('https://www.')) prepared = '0|' + url.substring(12);
    else if (url.startsWith('https://')) prepared = '1|' + url.substring(8);
    else if (url.startsWith('http://www.')) prepared = '2|' + url.substring(11);
    else if (url.startsWith('http://')) prepared = '3|' + url.substring(7);
    
    try {
      const utf8Bytes = new TextEncoder().encode(prepared);
      let binary = '';
      utf8Bytes.forEach(b => binary += String.fromCharCode(b));
      const base64 = btoa(binary);
      // Make base64 URL safe
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error(e);
      return btoa(encodeURIComponent(prepared)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  }

  function decodePortable(hash) {
    try {
      let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoded = new TextDecoder().decode(bytes);
      
      if (decoded.startsWith('0|')) return 'https://www.' + decoded.substring(2);
      if (decoded.startsWith('1|')) return 'https://' + decoded.substring(2);
      if (decoded.startsWith('2|')) return 'http://www.' + decoded.substring(2);
      if (decoded.startsWith('3|')) return 'http://' + decoded.substring(2);
      return decoded;
    } catch (e) {
      console.error("Failed to decode portable URL:", e);
      return null;
    }
  }

  function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // --- VAULT / DATABASE MANAGEMENT ---
  // (Moved to admin.js)

  // --- ACTIONS ---
  async function handleShorten(e) {
    e.preventDefault();
    let url = longUrlInput.value.trim();

    if (!isValidUrl(url)) {
      showToast('Please enter a valid URL (starting with http:// or https://)', 'error');
      return;
    }

    const currentOrigin = window.location.origin + window.location.pathname;
    let shortUrl = '';
    let shortCode = '';

    if (selectedMode === 'portable') {
      shortCode = encodePortable(url);
      shortUrl = `${currentOrigin}#c/${shortCode}`;
      
      // Save portable link to backend too, so admin sees it
      try {
        await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, mode: 'portable', alias: shortCode })
        });
      } catch(err) { console.error(err); }

      displayResults(url, shortUrl);
    } else {
      // Local Alias Mode
      let alias = customAliasInput.value.trim().toLowerCase();
      
      if (alias && !/^[a-z0-9-_]+$/.test(alias)) {
        showToast('Alias must contain only letters, numbers, dashes, and underscores', 'error');
        return;
      }
      
      try {
        const res = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, mode: 'local', alias })
        });
        const data = await res.json();
        
        if (!res.ok) {
          showToast(data.error || 'Failed to shorten', 'error');
          return;
        }
        displayResults(url, data.shortUrl);
      } catch(err) {
        showToast('Network error while shortening link', 'error');
        return;
      }
    }
  }

  function displayResults(originalUrl, shortUrl) {
    resultTypeBadge.textContent = selectedMode === 'portable' ? 'Portable' : 'Local Alias';
    resultTypeBadge.className = `badge-outline ${selectedMode}`;
    shortenedUrlText.value = shortUrl;
    resultOriginalLink.href = originalUrl;
    resultOriginalLink.textContent = originalUrl;
    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth' });

    showToast('Shortened link generated successfully!', 'success');
  }



  function copyToClipboard(text, triggerBtn) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
      
      if (triggerBtn) {
        const icon = triggerBtn.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'fa-solid fa-check';
        triggerBtn.style.borderColor = 'var(--success)';
        
        setTimeout(() => {
          icon.className = originalClass;
          triggerBtn.style.borderColor = '';
        }, 1500);
      }
    }).catch(err => {
      showToast('Failed to copy', 'error');
      console.error(err);
    });
  }

  function pasteFromClipboard() {
    navigator.clipboard.readText().then(text => {
      if (isValidUrl(text)) {
        longUrlInput.value = text;
        showToast('URL pasted from clipboard!', 'success');
      } else {
        showToast('Clipboard does not contain a valid URL', 'error');
      }
    }).catch(() => {
      showToast('Clipboard access denied', 'error');
    });
  }

  // --- MODALS ---
  function openQrModal(url) {
    qrUrlText.textContent = url;
    // Generate QR code using API
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    
    // Add load handler or visual indicator
    qrImage.style.opacity = '0.3';
    qrImage.src = qrCodeUrl;
    qrImage.onload = () => {
      qrImage.style.opacity = '1';
    };
    
    qrModal.classList.remove('hidden');
  }

  async function downloadQRImage() {
    if (!qrCodeUrl) return;
    
    try {
      showToast('Downloading QR Code...', 'info');
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'shortspire-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      // Fallback
      window.open(qrCodeUrl, '_blank');
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-fade-in`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // --- UTILS ---
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  // --- EVENT LISTENERS ---
  
  // Submit Form
  shortenForm.addEventListener('submit', handleShorten);

  // Clipboard Paste Shortcut
  btnPaste.addEventListener('click', pasteFromClipboard);

  // Tab switcher
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.getAttribute('data-mode');

      if (selectedMode === 'local') {
        localOptionsContainer.classList.remove('hidden');
      } else {
        localOptionsContainer.classList.add('hidden');
      }
    });
  });

  // Action button copy
  btnCopy.addEventListener('click', () => {
    copyToClipboard(shortenedUrlText.value, btnCopy);
  });

  // Action button QR
  btnQr.addEventListener('click', () => {
    openQrModal(shortenedUrlText.value);
  });

  // Search History
  searchHistory.addEventListener('input', (e) => {
    renderHistory(e.target.value);
  });

  // Clear vault
  btnClearHistory.addEventListener('click', clearVault);

  // QR Modal Close
  btnCloseQr.addEventListener('click', () => qrModal.classList.add('hidden'));
  btnDownloadQr.addEventListener('click', downloadQRImage);
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.classList.add('hidden');
  });

  // About Modal
  btnShowAbout.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.classList.remove('hidden');
  });
  btnCloseAbout.addEventListener('click', () => aboutModal.classList.add('hidden'));
  btnCloseAboutOk.addEventListener('click', () => aboutModal.classList.add('hidden'));
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.classList.add('hidden');
  });

  // Redirection Actions
  btnCancelRedirect.addEventListener('click', cancelRedirection);
});
