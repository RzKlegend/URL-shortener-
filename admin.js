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
      const geoId = `geo-${link.id}`;
      const ipId = `ip-${link.id}`;

      tr.innerHTML = `
        <td>
          <a href="${link.shortUrl}" target="_blank">${link.shortUrl}</a><br>
          <span class="meta-data" style="word-break: break-all;">${link.originalUrl}</span>
        </td>
        <td><span class="badge-outline ${link.type}">${link.type}</span></td>
        <td>${link.clicks || 0}</td>
        <td>
          <div class="meta-data">
            <strong>IP:</strong> <span id="${ipId}">${ip}</span><br>
            <strong>Location:</strong> <span id="${geoId}">Loading...</span><br>
            <strong>UA:</strong> ${link.userAgent || 'Unknown'}
          </div>
        </td>
        <td><span class="meta-data">${date}</span></td>
      `;
      tableBody.appendChild(tr);
      resolveGeolocation(ip, geoId, ipId);
    });
  }

  function resolveGeolocation(ip, geoId, ipId) {
    const geoEl = document.getElementById(geoId);
    const ipEl = document.getElementById(ipId);
    if (!geoEl) return;
    
    if (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1') || ip === 'localhost') {
      geoEl.textContent = 'Localhost (Your Device)';
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
          geoEl.textContent = 'Unknown (Lookup failed)';
        } else {
          const locationText = `${geo.city || ''}, ${geo.region || ''}, ${geo.country_name || ''} (${geo.org || 'Unknown ISP'})`;
          // If lat/lng are available, make both IP and Location clickable Google Maps links
          if (geo.latitude && geo.longitude) {
            const mapsUrl = `https://www.google.com/maps/@${geo.latitude},${geo.longitude},14z`;
            geoEl.innerHTML = `<a href="${mapsUrl}" target="_blank" style="color: var(--secondary); text-decoration: none;" title="View on Google Maps">${locationText} <i class="fa-solid fa-map-location-dot" style="font-size:0.7rem"></i></a>`;
            // Also make the IP address a clickable Maps link using the resolved coordinates
            if (ipEl) {
              ipEl.innerHTML = `<a href="${mapsUrl}" target="_blank" style="color: var(--secondary); text-decoration: none;" title="View location of ${cleanIp} on Google Maps">${ip} <i class="fa-solid fa-location-dot" style="font-size:0.7rem"></i></a>`;
            }
          } else {
            geoEl.textContent = locationText;
          }
        }
      })
      .catch(() => {
        geoEl.textContent = 'Unknown (Network error)';
      });
  }
});
