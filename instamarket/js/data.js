// ===== InstaMarket.uz — Ma'lumotlar bazasi =====

// 1 USD = 12,700 so'm (taxminiy kurs)
const USD_RATE = 12700;
const COMMISSION = 0.10; // 10%
const MIN_PRICE  = 50000; // 50,000 so'm

// So'mga o'tkazish
function toUZS(usd) { return Math.round(usd * USD_RATE / 10000) * 10000; }
function formatUZS(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + ' mln so\'m';
  if (n >= 1000)    return n.toLocaleString('uz-UZ') + ' so\'m';
  return n + ' so\'m';
}
function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n/1000).toFixed(1) + 'K';
  return n;
}
function calcCommission(price) { return Math.round(price * COMMISSION); }
function sellerGets(price)     { return price - calcCommission(price); }

const accounts = [
  {
    id: 1, username: "travel_uzbekistan", emoji: "✈️",
    niche: "Travel & Lifestyle", category: "travel",
    followers: 1240, er: 6.4, posts: 87, age: "1 yil 2 oy",
    realFollowers: 94, score: 91, price: 120000,
    audience: "78% O'zbekiston", badge: "verified",
    description: "Sayohat va turizm sohasidagi account. O'zbekiston va qo'shni davlatlar haqida. Auditoriya 18-34 yoshli O'zbek yoshlar.",
    seller: { name: "Jasur T.", rating: 4.9, sales: 3, emoji: "👨" },
    tags: ["travel", "uzbekistan", "lifestyle"], featured: true
  },
  {
    id: 2, username: "food_toshkent", emoji: "🍔",
    niche: "Ovqat & Restoran", category: "food",
    followers: 2100, er: 7.2, posts: 124, age: "1 yil 8 oy",
    realFollowers: 91, score: 93, price: 190000,
    audience: "88% Toshkent", badge: "verified",
    description: "Toshkentdagi restoran va kafelar sharhi. Retseptlar va ovqat fotolari. Faol auditoriya.",
    seller: { name: "Nilufar R.", rating: 5.0, sales: 2, emoji: "👩" },
    tags: ["food", "toshkent", "restaurant"], featured: true
  },
  {
    id: 3, username: "fitness_uz", emoji: "💪",
    niche: "Fitness & Sport", category: "fitness",
    followers: 1850, er: 5.8, posts: 96, age: "1 yil",
    realFollowers: 89, score: 90, price: 160000,
    audience: "72% O'zbekiston", badge: "verified",
    description: "Fitness va sog'lom turmush tarzi. Trening mashqlari va dietalar. Faol hamjamiyat.",
    seller: { name: "Bobur M.", rating: 4.8, sales: 1, emoji: "👨" },
    tags: ["fitness", "sport", "motivation"], featured: true
  },
  {
    id: 4, username: "beauty_uz_girl", emoji: "💄",
    niche: "Go'zallik & Moda", category: "beauty",
    followers: 1320, er: 8.1, posts: 78, age: "10 oy",
    realFollowers: 96, score: 95, price: 130000,
    audience: "95% Ayollar", badge: "top",
    description: "Go'zallik sirlari va makiyaj darslari. Mahsulot sharhlari. Eng yuqori engagement rate.",
    seller: { name: "Kamola S.", rating: 5.0, sales: 4, emoji: "👩" },
    tags: ["beauty", "makeup", "fashion"], featured: true
  },
  {
    id: 5, username: "biznes_uz", emoji: "💼",
    niche: "Biznes & Moliya", category: "business",
    followers: 4800, er: 4.9, posts: 145, age: "2 yil",
    realFollowers: 87, score: 88, price: 200000,
    audience: "80% Tadbirkorlar", badge: "verified",
    description: "Biznes va moliyaviy maslahatlar. O'zbek tadbirkorlar uchun amaliy kontentlar.",
    seller: { name: "Sardor A.", rating: 4.7, sales: 2, emoji: "👨" },
    tags: ["business", "finance", "entrepreneur"], featured: true
  },
  {
    id: 6, username: "tech_uzbek", emoji: "📱",
    niche: "Texnologiya", category: "tech",
    followers: 1100, er: 6.8, posts: 62, age: "8 oy",
    realFollowers: 93, score: 92, price: 80000,
    audience: "82% Yoshlar (18-28)", badge: "verified",
    description: "Smartfonlar, gadjetlar va tech yangiliklar. O'zbek tilida IT kontenti.",
    seller: { name: "Akbar N.", rating: 4.9, sales: 1, emoji: "👨" },
    tags: ["tech", "gadgets", "it"], featured: false
  },
  {
    id: 7, username: "art_gallery_uz", emoji: "🎨",
    niche: "San'at & Dizayn", category: "art",
    followers: 1450, er: 9.2, posts: 110, age: "1 yil 4 oy",
    realFollowers: 97, score: 97, price: 100000,
    audience: "70% Ijodkor yoshlar", badge: "top",
    description: "O'zbek rassomlari va dizaynerlar ishlari. Juda yuqori ER — 9.2%! Faol hamjamiyat.",
    seller: { name: "Zulfiya H.", rating: 5.0, sales: 2, emoji: "👩" },
    tags: ["art", "design", "creative"], featured: false
  },
  {
    id: 8, username: "home_decor_uz", emoji: "🏠",
    niche: "Uy & Interyer", category: "home",
    followers: 3200, er: 5.5, posts: 132, age: "1 yil 9 oy",
    realFollowers: 90, score: 91, price: 180000,
    audience: "85% Oila egalari", badge: "verified",
    description: "Uy bezatish, mebel va interyer dizayni. Qurilish va ta'mirlash sohasida faol.",
    seller: { name: "Munira B.", rating: 4.8, sales: 3, emoji: "👩" },
    tags: ["home", "interior", "decor"], featured: false
  }
];

// ===== USER =====
function loadUser() {
  try { return JSON.parse(localStorage.getItem('im_user') || 'null'); } catch { return null; }
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ===== ACCOUNT CARD (bosh sahifa uchun) =====
function renderCard(acc, basePath) {
  const path  = basePath || '';
  const badge = acc.badge === 'top'
    ? '<span class="badge badge-top">⭐ TOP</span>'
    : '<span class="badge badge-verified">✅ Verified</span>';
  return `
  <a href="${path}pages/account.html?id=${acc.id}" class="account-card">
    <div class="card-top">
      <div class="card-avatar">${acc.emoji}</div>
      <div>
        <div class="card-username">@${acc.username}</div>
        <div class="card-niche">${acc.niche}</div>
        <div class="card-badge-wrap">${badge}</div>
      </div>
    </div>
    <div class="card-stats">
      <div class="card-stat">
        <div class="val">${formatNum(acc.followers)}</div>
        <div class="key">Followers</div>
      </div>
      <div class="card-stat">
        <div class="val" style="color:var(--green)">${acc.er}%</div>
        <div class="key">ER</div>
      </div>
      <div class="card-stat">
        <div class="val">${acc.score}</div>
        <div class="key">Ball</div>
      </div>
    </div>
    <div class="card-foot">
      <div class="card-price">${formatUZS(acc.price)}</div>
      <button class="card-btn" onclick="event.preventDefault();window.location.href='${path}pages/account.html?id=${acc.id}'">Ko'rish →</button>
    </div>
  </a>`;
}

function renderAccountCard(acc) { return renderCard(acc, '../'); }
