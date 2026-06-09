// ===== InstaBazar.uz — main.js =====

// ===== TOAST =====
function showToast(msg, type) {
  type = type || 'success';
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = '<span>' + (type === 'success' ? '✅' : '❌') + '</span><span>' + msg + '</span>';
  c.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0'; t.style.transform = 'translateX(110%)'; t.style.transition = 'all 0.3s';
    setTimeout(function() { t.remove(); }, 320);
  }, 3000);
}

// ===== MODAL =====
function openModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  var m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ===== NAVBAR =====
function toggleMenu() {
  var nav = document.querySelector('.nav-links');
  if (!nav) return;
  var isOpen = nav.style.display === 'flex';
  nav.style.cssText = isOpen ? '' :
    'display:flex;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:white;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,0.1);border-bottom:1px solid #e5e7eb;z-index:999;gap:4px;';
}

// ===== NAVBAR USER =====
function updateNavbar() {
  var user = loadUser();
  var nav  = document.querySelector('.nav-links');
  if (!nav) return;

  if (!user) return; // Kirmaganlarga o'zgartirish kerak emas

  // Login/Register yashirish
  var login = nav.querySelector('a[href*="login"]');
  var reg   = nav.querySelector('a[href*="register"]');
  if (login) login.style.display = 'none';
  if (reg)   reg.style.display   = 'none';

  // Takroran qo'shmaslik
  if (nav.querySelector('.nav-profile')) return;

  var base = (window.location.pathname.includes('/pages/') ||
              window.location.pathname.includes('/admin/')) ? '../' : '';

  // Profil tugmasi
  var initials   = (user.name || user.email || 'U')[0].toUpperCase();
  var avatarHtml = user.avatar
    ? '<img src="' + user.avatar + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--border);" />'
    : '<span style="background:var(--gradient);color:white;border-radius:50%;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">' + initials + '</span>';

  var pLink = document.createElement('a');
  pLink.href      = base + 'pages/profile.html';
  pLink.className = 'nav-profile';
  pLink.style.cssText = 'display:inline-flex;align-items:center;gap:7px;font-weight:600;font-size:14px;';
  pLink.innerHTML = avatarHtml + '<span>' + (user.name ? user.name.split(' ')[0] : 'Profil') + '</span>';
  nav.appendChild(pLink);

  // Chiqish
  var lOut = document.createElement('a');
  lOut.href      = '#';
  lOut.textContent = 'Chiqish';
  lOut.style.cssText = 'color:var(--text-muted);font-size:13px;';
  lOut.onclick   = function(e) {
    e.preventDefault();
    if (confirm('Chiqmoqchimisiz?')) { logoutUser(); window.location.reload(); }
  };
  nav.appendChild(lOut);
}

// ===== ADMIN CHART =====
function updateChart(period) {
  // Chart yangilash (vizual only)
  var bars = document.querySelectorAll('#chartBars > div');
  var data = period === 'month'
    ? [42,38,55,61,48,70,65,58,72,80,68,74,55,60,78,82,70,65,88,92,75,68,85,90,72,68,80,85,92,95]
    : [8,12,7,15,20,18,10];
  bars.forEach(function(bar, i) {
    if (!data[i]) return;
    var max = Math.max.apply(null, data);
    var h = Math.round((data[i] / max) * 110);
    var fill = bar.querySelector('div');
    var num = bar.querySelector('span:first-child');
    if (fill) fill.style.height = h + 'px';
    if (num) num.textContent = data[i];
  });
}

// ===== FILTER TABLE (admin) =====
function filterTable(q) {
  document.querySelectorAll('#allBody tr, #pendingBody tr').forEach(function(row) {
    row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
function filterByStatus(status) {
  document.querySelectorAll('#allBody tr').forEach(function(row) {
    if (!status || status === 'all') { row.style.display = ''; return; }
    var badge = row.querySelector('.status-badge');
    var txt = badge ? badge.textContent.toLowerCase() : '';
    var show = false;
    if (status === 'pending' && (txt.includes('kut') || txt.includes('pending'))) show = true;
    if (status === 'active' && (txt.includes('aktiv') || txt.includes('active'))) show = true;
    if (status === 'rejected' && (txt.includes('rad') || txt.includes('rejected'))) show = true;
    row.style.display = show ? '' : 'none';
  });
}

// ===== ANIMATIONS =====
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.addEventListener('DOMContentLoaded', function() {
  updateNavbar();

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // Animatsiyalar
  document.querySelectorAll('.trust-card, .step, .account-card, .dash-card').forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(el);
  });

  // Bosh sahifada featured cards
  var fc = document.getElementById('featuredCards');
  if (fc) {
    fc.innerHTML = accounts.slice(0, 8).map(function(a) { return renderCard(a, ''); }).join('');
  }
});

// ===== SEARCH (bosh sahifa) =====
function searchAccounts() {
  var q = document.getElementById('heroSearch');
  var val = q ? q.value : '';
  window.location.href = 'pages/marketplace.html?q=' + encodeURIComponent(val);
}
var hs = document.getElementById('heroSearch');
if (hs) {
  hs.addEventListener('keypress', function(e) { if (e.key === 'Enter') searchAccounts(); });
}



// ===== ADMIN MOBILE MENU (hamburger) =====
// Barcha admin sahifalarda ishlaydi (ular main.js ni yuklaydi).
// Telefonda yashirin sidebar'ni ochish/yopish uchun tugma va overlay qo'shadi.
(function () {
  function initAdminMobile() {
    var sidebar = document.querySelector('.admin-sidebar');
    var topbar = document.querySelector('.admin-topbar');
    if (!sidebar || !topbar) return;               // faqat admin sahifalarda
    if (document.querySelector('.admin-burger')) return; // ikki marta qo'shilmasin

    var burger = document.createElement('button');
    burger.className = 'admin-burger';
    burger.setAttribute('aria-label', 'Menyu');
    burger.type = 'button';
    burger.innerHTML = '\u2630'; // ☰
    topbar.insertBefore(burger, topbar.firstChild);

    var overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    document.body.appendChild(overlay);

    function openMenu() { sidebar.classList.add('open'); overlay.classList.add('show'); }
    function closeMenu() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

    burger.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) closeMenu(); else openMenu();
    });
    overlay.addEventListener('click', closeMenu);
    // Sidebar ichidagi havola bosilsa, menyu yopilsin
    var links = sidebar.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) links[i].addEventListener('click', closeMenu);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminMobile);
  } else {
    initAdminMobile();
  }
})();
