// ===== InstaMarket.uz — Asosiy JS =====

// Toast bildirish
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icon = type === 'success' ? '✅' : '❌';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Navbar mobile menu
function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.position = 'absolute';
  nav.style.top = '68px';
  nav.style.left = '0';
  nav.style.right = '0';
  nav.style.background = 'white';
  nav.style.padding = '16px';
  nav.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
  nav.style.borderBottom = '1px solid #e5e7eb';
  nav.style.zIndex = '999';
}

// Navbar: foydalanuvchi tizimga kirganmi?
document.addEventListener('DOMContentLoaded', function() {
  const user = loadUser();
  updateNavbar(user);
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
});

function updateNavbar(user) {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks || !user) return;
  // Login/register tugmalarini olib tashlash, profil qo'shish
  const loginBtn = navLinks.querySelector('a[href*="login"]');
  const regBtn = navLinks.querySelector('a[href*="register"]');
  if (loginBtn) loginBtn.remove();
  if (regBtn) regBtn.remove();
  const profileLink = document.createElement('a');
  profileLink.href = user.role === 'admin' ? '../admin/index.html' : '#';
  profileLink.innerHTML = `<span style="background:var(--gradient);color:white;border-radius:50%;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">${user.name[0].toUpperCase()}</span>`;
  profileLink.title = user.name;
  const logoutLink = document.createElement('a');
  logoutLink.href = '#';
  logoutLink.textContent = 'Chiqish';
  logoutLink.onclick = function(e) { e.preventDefault(); localStorage.removeItem('instamarket_user'); window.location.reload(); };
  navLinks.appendChild(profileLink);
  navLinks.appendChild(logoutLink);
}

// Raqamlarni animatsiya bilan ko'rsatish
function animateNumbers() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'));
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// Intersection Observer — animatsiyalar
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.trust-card, .step, .account-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});

// URL parametrlarini olish
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
