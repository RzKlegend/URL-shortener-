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
      
      tr.innerHTML = `
        <td>
          <a href="${link.shortUrl}" target="_blank">${link.shortUrl}</a><br>
          <span class="meta-data" style="word-break: break-all;">${link.originalUrl}</span>
        </td>
        <td><span class="badge-outline ${link.type}">${link.type}</span></td>
        <td>${link.clicks || 0}</td>
        <td>
          <div class="meta-data">
            <strong>IP:</strong> ${link.ip || 'Unknown'}<br>
            <strong>UA:</strong> ${link.userAgent || 'Unknown'}
          </div>
        </td>
        <td><span class="meta-data">${date}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  }
});
