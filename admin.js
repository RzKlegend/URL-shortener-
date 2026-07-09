document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  const passwordInput = document.getElementById('admin-password');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const tableBody = document.getElementById('admin-table-body');

  checkSession();

  btnLogin.addEventListener('click', () => {
    const pass = passwordInput.value;
    if (pass) {
      sessionStorage.setItem('admin_token', pass);
      checkSession();
    }
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_token');
    adminView.classList.add('hidden');
    loginView.classList.remove('hidden');
    passwordInput.value = '';
  });

  function checkSession() {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      loadData(token);
    }
  }

  function loadData(token) {
    fetch('/api/links', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    })
    .then(data => {
      loginView.classList.add('hidden');
      adminView.classList.remove('hidden');
      renderTable(data);
    })
    .catch(err => {
      alert('Invalid password');
      sessionStorage.removeItem('admin_token');
    });
  }

  function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach(link => {
      const tr = document.createElement('tr');
      const date = new Date(link.date).toLocaleString();
      const ip = link.ip || 'Unknown';
      const cellId = `geo-${link.id}`;
      
      // Build a Google Maps search link for the IP
      const isLocalIp = (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1') || ip === 'localhost');
      const ipDisplay = isLocalIp
        ? `<span title="Localhost">${ip}</span>`
        : `<a href="https://www.google.com/maps/search/${encodeURIComponent(ip)}" target="_blank" style="color: var(--secondary); text-decoration: none;" title="Search IP on Google Maps">${ip} <i class="fa-solid fa-location-dot" style="font-size:0.7rem"></i></a>`;

      tr.innerHTML = `
        <td>
          <a href="${link.shortUrl}" target="_blank">${link.shortUrl}</a><br>
          <span class="meta-data" style="word-break: break-all;">${link.originalUrl}</span>
        </td>
        <td><span class="badge-outline ${link.type}">${link.type}</span></td>
        <td>${link.clicks || 0}</td>
        <td>
          <div class="meta-data">
            <strong>IP:</strong> ${ipDisplay}<br>
            <strong>Location:</strong> <span id="${cellId}">Loading...</span><br>
            <strong>UA:</strong> ${link.userAgent || 'Unknown'}
          </div>
        </td>
        <td><span class="meta-data">${date}</span></td>
      `;
      tableBody.appendChild(tr);
      resolveGeolocation(ip, cellId);
    });
  }

  function resolveGeolocation(ip, cellId) {
    const el = document.getElementById(cellId);
    if (!el) return;
    
    if (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1') || ip === 'localhost') {
      el.textContent = 'Localhost (Your Device)';
      return;
    }
    
    let cleanIp = ip;
    if (ip.startsWith('::ffff:')) {
      cleanIp = ip.substring(7);
    }
    
    fetch(`https://ipapi.co/${cleanIp}/json/`)
      .then(res => res.json())
      .then(geo => {
        if (geo.error) {
          el.textContent = 'Unknown (Lookup failed)';
        } else {
          const locationText = `${geo.city || ''}, ${geo.region || ''}, ${geo.country_name || ''} (${geo.org || 'Unknown ISP'})`;
          // If lat/lng are available, create a precise Google Maps link
          if (geo.latitude && geo.longitude) {
            const mapsUrl = `https://www.google.com/maps/@${geo.latitude},${geo.longitude},14z`;
            el.innerHTML = `<a href="${mapsUrl}" target="_blank" style="color: var(--secondary); text-decoration: none;" title="View on Google Maps">${locationText} <i class="fa-solid fa-map-location-dot" style="font-size:0.7rem"></i></a>`;
          } else {
            el.textContent = locationText;
          }
        }
      })
      .catch(() => {
        el.textContent = 'Unknown (Network error)';
      });
  }
});
