// ===== InstaMarket.uz — Ma'lumotlar bazasi (Demo) =====

const accounts = [
  {
    id: 1, username: "travel_uzbekistan", emoji: "✈️",
    niche: "Travel & Lifestyle", category: "travel",
    followers: 24800, er: 6.4, posts: 312, age: "2 yil 3 oy",
    realFollowers: 94, score: 96, price: 220,
    audience: "78% O'zbekiston", badge: "verified",
    description: "Sayohat va turizm sohasidagi faol account. O'zbekiston va xorijdagi go'zal joylar haqida. Auditoriya asosan 18-34 yoshli o'zbek yoshlar.",
    seller: { name: "Jasur T.", rating: 4.9, sales: 14, emoji: "👨" },
    tags: ["travel", "uzbekistan", "lifestyle"],
    featured: true
  },
  {
    id: 2, username: "food_toshkent", emoji: "🍔",
    niche: "Ovqat & Restoran", category: "food",
    followers: 18200, er: 7.2, posts: 445, age: "3 yil",
    realFollowers: 91, score: 94, price: 165,
    audience: "88% Toshkent", badge: "verified",
    description: "Toshkentdagi restoran va kafelarning sharhi. Retseptlar va ovqat fotolari. Juda yuqori engagement rate.",
    seller: { name: "Nilufar R.", rating: 5.0, sales: 8, emoji: "👩" },
    tags: ["food", "toshkent", "restaurant"],
    featured: true
  },
  {
    id: 3, username: "fitness_motivation_uz", emoji: "💪",
    niche: "Fitness & Sport", category: "fitness",
    followers: 31500, er: 5.8, posts: 520, age: "4 yil",
    realFollowers: 89, score: 92, price: 310,
    audience: "72% O'zbekiston", badge: "verified",
    description: "Fitness, trening va sog'lom turmush tarzi. Kuchli hamjamiyat, faol auditoriya. Brendlar bilan hamkorlik tajribasi bor.",
    seller: { name: "Bobur M.", rating: 4.8, sales: 22, emoji: "👨" },
    tags: ["fitness", "sport", "motivation"],
    featured: true
  },
  {
    id: 4, username: "beauty_secrets_uz", emoji: "💄",
    niche: "Go'zallik & Moda", category: "beauty",
    followers: 15600, er: 8.1, posts: 280, age: "2 yil 6 oy",
    realFollowers: 96, score: 98, price: 195,
    audience: "95% Ayollar", badge: "top",
    description: "Go'zallik sirlari, makiyaj darslari va mahsulot sharhlari. Eng yuqori engagement ratetdan biri. Kosmetika brendlari uchun ideal.",
    seller: { name: "Kamola S.", rating: 5.0, sales: 31, emoji: "👩" },
    tags: ["beauty", "makeup", "fashion"],
    featured: true
  },
  {
    id: 5, username: "biznes_akademiya", emoji: "💼",
    niche: "Biznes & Moliya", category: "business",
    followers: 42000, er: 4.9, posts: 680, age: "5 yil",
    realFollowers: 87, score: 90, price: 480,
    audience: "80% Tadbirkorlar", badge: "verified",
    description: "Biznes, investitsiya va moliyaviy erkinlik haqida. O'zbek biznesmenlar uchun amaliy maslahatlar. Katta va faol auditoriya.",
    seller: { name: "Sardor A.", rating: 4.7, sales: 5, emoji: "👨" },
    tags: ["business", "finance", "entrepreneur"],
    featured: true
  },
  {
    id: 6, username: "tech_uzbek", emoji: "📱",
    niche: "Texnologiya", category: "tech",
    followers: 12400, er: 6.8, posts: 195, age: "1 yil 8 oy",
    realFollowers: 93, score: 95, price: 130,
    audience: "82% Yoshlar (18-28)", badge: "verified",
    description: "Smartfonlar, gadjetlar va tech yangiliklar. O'zbek tilida IT va texnologiya kontenti. Yosh va faol auditoriya.",
    seller: { name: "Akbar N.", rating: 4.9, sales: 7, emoji: "👨" },
    tags: ["tech", "gadgets", "it"],
    featured: false
  },
  {
    id: 7, username: "art_gallery_uz", emoji: "🎨",
    niche: "San'at & Dizayn", category: "art",
    followers: 9800, er: 9.2, posts: 340, age: "3 yil 2 oy",
    realFollowers: 97, score: 99, price: 115,
    audience: "70% Ijodkor yoshlar", badge: "top",
    description: "O'zbek rassomlari va dizaynerlarining ishlari. Eng yuqori ER — 9.2%! Kichik lekin juda faol hamjamiyat.",
    seller: { name: "Zulfiya H.", rating: 5.0, sales: 3, emoji: "👩" },
    tags: ["art", "design", "creative"],
    featured: false
  },
  {
    id: 8, username: "home_decor_uz", emoji: "🏠",
    niche: "Uy & Interyer", category: "home",
    followers: 22100, er: 5.5, posts: 410, age: "3 yil 8 oy",
    realFollowers: 90, score: 93, price: 245,
    audience: "85% Oila egalari", badge: "verified",
    description: "Uy bezatish, mebel va interyer dizayni. Qurilish va ta'mirlash sohasidagi brendlar uchun ajoyib platforma.",
    seller: { name: "Munira B.", rating: 4.8, sales: 18, emoji: "👩" },
    tags: ["home", "interior", "decor"],
    featured: false
  }
];

// Foydalanuvchilar (demo)
let currentUser = null;

// LocalStorage dan user olish
function loadUser() {
  const saved = localStorage.getItem('instamarket_user');
  if (saved) currentUser = JSON.parse(saved);
  return currentUser;
}

// Formatlar
function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n;
}

function formatPrice(p) { return '$' + p; }

// Account card render
function renderAccountCard(acc) {
  const badgeHtml = acc.badge === 'top'
    ? '<span class="card-badge badge-top">⭐ TOP</span>'
    : '<span class="card-badge badge-verified">✅ Verified</span>';
  return `
    <a href="pages/account.html?id=${acc.id}" class="account-card">
      <div class="card-header">
        <div class="card-avatar">${acc.emoji}</div>
        <div>
          <div class="card-username">@${acc.username}</div>
          <div class="card-niche">${acc.niche}</div>
          <div class="card-verify">${badgeHtml}</div>
        </div>
      </div>
      <div class="card-stats">
        <div class="card-stat">
          <div class="val">${formatNum(acc.followers)}</div>
          <div class="key">Followers</div>
        </div>
        <div class="card-stat">
          <div class="val" style="color:var(--green)">${acc.er}%</div>
          <div class="key">Eng. Rate</div>
        </div>
        <div class="card-stat">
          <div class="val">${acc.score}</div>
          <div class="key">Ball</div>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-price">${formatPrice(acc.price)}</div>
        <button class="card-buy" onclick="event.preventDefault(); window.location.href='pages/account.html?id=${acc.id}'">Ko'rish →</button>
      </div>
    </a>`;
}
