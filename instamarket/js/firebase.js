// ===== InstaMarket.uz — Firebase v2 =====

const firebaseConfig = {
  apiKey: "AIzaSyCMexR_na10b385sHFLFYzyjHK1AQLJT8s",
  authDomain: "instamarket-uz.firebaseapp.com",
  projectId: "instamarket-uz",
  storageBucket: "instamarket-uz.firebasestorage.app",
  messagingSenderId: "721123684030",
  appId: "1:721123684030:web:47c23e27ed9009141438ef",
  measurementId: "G-KZ1FTTP67H"
};

let app, auth, db;
const ADMIN_KEY = 'im_admin_v2';
const ADMIN_PASS = 'instamarket2024admin';

function initFirebase() {
  try {
    // Takroriy init dan saqlash
    if (firebase.apps.length > 0) {
      app  = firebase.apps[0];
    } else {
      app  = firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db   = firebase.firestore();
    db.enablePersistence().catch(function(){});
    return true;
  } catch(e) {
    console.warn('Firebase ulanmadi:', e.message);
    return false;
  }
}

// ===== LOCAL STORAGE =====
function saveUserLocal(u) { localStorage.setItem('im_user', JSON.stringify(u)); }
function loadUser() {
  try { return JSON.parse(localStorage.getItem('im_user') || 'null'); } catch { return null; }
}
function logoutUser() {
  if (auth) { try { auth.signOut(); } catch(e){} }
  localStorage.removeItem('im_user');
  sessionStorage.removeItem(ADMIN_KEY);
}

// ===== ADMIN AUTH =====
function checkAdminSession() {
  return sessionStorage.getItem(ADMIN_KEY) === ADMIN_PASS;
}
function setAdminSession() {
  sessionStorage.setItem(ADMIN_KEY, ADMIN_PASS);
}
// Har bir admin sahifada chaqiriladi
function requireAdmin() {
  if (!checkAdminSession()) {
    showAdminLoginScreen();
    return false;
  }
  return true;
}
function showAdminLoginScreen() {
  document.body.innerHTML = `
  <div style="min-height:100vh;background:#0a0a0a;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;">
    <div style="background:white;border-radius:20px;padding:40px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:52px;margin-bottom:10px;">🔐</div>
        <h2 style="font-size:22px;font-weight:800;margin-bottom:6px;">Admin Panel</h2>
        <p style="font-size:13px;color:#6b7280;">InstaMarket.uz — Faqat adminlar</p>
      </div>
      <div id="apErr" style="display:none;background:#fee2e2;color:#b91c1c;border-radius:8px;padding:10px;font-size:13px;margin-bottom:14px;text-align:center;"></div>
      <input type="password" id="apInp" placeholder="Admin parolini kiriting..."
        style="width:100%;padding:13px 15px;border:2px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:Inter,sans-serif;outline:none;box-sizing:border-box;margin-bottom:12px;"
        onkeypress="if(event.key==='Enter')adminLogin()"
        onfocus="this.style.borderColor='#C13584'" onblur="this.style.borderColor='#e5e7eb'"/>
      <button onclick="adminLogin()"
        style="width:100%;background:linear-gradient(135deg,#833AB4,#C13584,#E1306C);color:white;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">
        Kirish →
      </button>
    </div>
  </div>`;
  window.adminLogin = function() {
    var v = document.getElementById('apInp').value;
    if (v === ADMIN_PASS) {
      setAdminSession();
      window.location.reload();
    } else {
      var e = document.getElementById('apErr');
      e.textContent = '❌ Parol noto\'g\'ri!';
      e.style.display = 'block';
      setTimeout(function(){ e.style.display='none'; }, 2500);
    }
  };
}

// ===== USER AUTH =====
async function registerUser(email, password, name, role) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    const userData = {
      uid: cred.user.uid, name, email, role,
      status: 'active', sales: 0, rating: 5.0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('users').doc(cred.user.uid).set(userData);
    saveUserLocal({ uid: cred.user.uid, name, email, role });
    return { success: true };
  } catch(e) {
    return { success: false, error: firebaseErr(e.code) };
  }
}

async function loginUser(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    let role = 'buyer';
    try {
      const doc = await db.collection('users').doc(cred.user.uid).get();
      if (doc.exists) role = doc.data().role || 'buyer';
    } catch(e){}
    const u = { uid: cred.user.uid, name: cred.user.displayName || email.split('@')[0], email, role };
    saveUserLocal(u);
    return { success: true, user: u };
  } catch(e) {
    return { success: false, error: firebaseErr(e.code) };
  }
}

async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return { success: true };
  } catch(e) {
    return { success: false, error: firebaseErr(e.code) };
  }
}

// ===== LISTINGS =====
async function addListing(data) {
  try {
    const user = loadUser();
    if (!user) return { success: false, error: 'Kirish talab qilinadi' };
    const ref = await db.collection('listings').add({
      ...data,
      uid: user.uid, sellerName: user.name,
      status: 'pending', views: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: ref.id };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

async function getListings(category) {
  try {
    let q = db.collection('listings').where('status', '==', 'active');
    if (category && category !== 'all') {
      q = q.where('category', '==', category);
    }
    const snap = await q.limit(50).get();
    return snap.docs.map(function(d){ return { id: d.id, ...d.data() }; });
  } catch(e) {
    return [];
  }
}

async function getListing(id) {
  try {
    const doc = await db.collection('listings').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch(e) { return null; }
}

async function moderateListing(id, status, reason) {
  try {
    await db.collection('listings').doc(id).update({
      status, rejectReason: reason || '',
      moderatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

async function incrementViews(id) {
  try {
    await db.collection('listings').doc(id).update({
      views: firebase.firestore.FieldValue.increment(1)
    });
  } catch(e){}
}

// ===== ORDERS =====
async function createOrder(listingId, paymentMethod) {
  try {
    const user = loadUser();
    if (!user) return { success: false, error: 'Kirish talab qilinadi' };
    const listing = await getListing(listingId);
    if (!listing) return { success: false, error: 'E\'lon topilmadi' };
    const ref = await db.collection('orders').add({
      listingId, listingTitle: listing.username || '',
      listingEmoji: listing.emoji || '📱',
      buyerUid: user.uid, buyerName: user.name,
      sellerUid: listing.uid || '', sellerName: listing.sellerName || '',
      amount: listing.price,
      commission: Math.round((listing.price || 0) * 0.12),
      paymentMethod, status: 'escrow',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      checkDeadline: new Date(Date.now() + 72 * 3600 * 1000)
    });
    await db.collection('listings').doc(listingId).update({ status: 'sold' });
    return { success: true, orderId: ref.id };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ===== CHAT =====
const FORBIDDEN = ['telegram','t.me','whatsapp','@gmail','tel:','phone','telefon','instagram.com/direct'];
function hasForbiddenContact(text) {
  var t = text.toLowerCase();
  return FORBIDDEN.some(function(w){ return t.includes(w); });
}

async function sendChatMessage(listingId, text) {
  try {
    const user = loadUser();
    if (!user) return { success: false, error: 'Kirish talab qilinadi' };
    if (hasForbiddenContact(text)) {
      return { success: false, error: '⚠️ Tashqi aloqa ma\'lumotlari taqiqlanadi!' };
    }
    await db.collection('chats').doc(listingId)
      .collection('messages').add({
        text, uid: user.uid, name: user.name, role: user.role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function listenChat(listingId, callback) {
  if (!db) { callback([]); return function(){}; }
  return db.collection('chats').doc(listingId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(function(snap) {
      callback(snap.docs.map(function(d){ return { id: d.id, ...d.data() }; }));
    }, function(err){ console.warn('Chat xato:', err); });
}

// ===== ADMIN STATS =====
async function getAdminStats() {
  try {
    const [uSnap, lSnap, oSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('listings').get(),
      db.collection('orders').get()
    ]);
    const pending  = lSnap.docs.filter(function(d){ return d.data().status==='pending'; }).length;
    const active   = lSnap.docs.filter(function(d){ return d.data().status==='active'; }).length;
    const revenue  = oSnap.docs.reduce(function(s,d){ return s+(d.data().commission||0); }, 0);
    return {
      totalUsers: uSnap.size, activeListings: active,
      pendingListings: pending, totalOrders: oSnap.size, totalRevenue: revenue
    };
  } catch(e) {
    return { totalUsers:0, activeListings:0, pendingListings:0, totalOrders:0, totalRevenue:0 };
  }
}

async function getAdminUsers(limitN) {
  try {
    const snap = await db.collection('users').orderBy('createdAt','desc').limit(limitN||50).get();
    return snap.docs.map(function(d){ return { id: d.id, ...d.data() }; });
  } catch(e) { return []; }
}

async function getAdminOrders(limitN) {
  try {
    const snap = await db.collection('orders').orderBy('createdAt','desc').limit(limitN||50).get();
    return snap.docs.map(function(d){ return { id: d.id, ...d.data() }; });
  } catch(e) { return []; }
}

async function getAdminListings(limitN) {
  try {
    const snap = await db.collection('listings').orderBy('createdAt','desc').limit(limitN||100).get();
    return snap.docs.map(function(d){ return { id: d.id, ...d.data() }; });
  } catch(e) { return []; }
}

async function blockUser(uid, block) {
  try {
    await db.collection('users').doc(uid).update({ status: block ? 'blocked' : 'active' });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

async function resolveDisputeDB(orderId, winner) {
  try {
    await db.collection('orders').doc(orderId).update({
      status: winner === 'buyer' ? 'refunded' : 'done',
      disputeResolved: true,
      resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

async function saveSettings(data) {
  try {
    await db.collection('admin').doc('settings').set({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

async function loadSettings() {
  try {
    const doc = await db.collection('admin').doc('settings').get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

// ===== DEMO LOGIN =====
function demoLogin(role) {
  const u = {
    buyer:  { uid:'demo-buyer',  name:'Demo Xaridor', email:'buyer@demo.uz',  role:'buyer'  },
    seller: { uid:'demo-seller', name:'Demo Sotuvchi',email:'seller@demo.uz', role:'seller' },
    admin:  { uid:'demo-admin',  name:'Admin',        email:'admin@instamarket.uz', role:'admin' }
  }[role] || { uid:'demo', name:'Demo', email:'demo@demo.uz', role:'buyer' };
  saveUserLocal(u);
  return u;
}

// ===== XATOLAR =====
function firebaseErr(code) {
  return ({
    'auth/email-already-in-use': 'Bu email allaqachon ro\'yxatdan o\'tgan!',
    'auth/invalid-email':        'Email noto\'g\'ri formatda!',
    'auth/weak-password':        'Parol juda zaif! Kamida 6 ta belgi.',
    'auth/user-not-found':       'Bu email bilan hisob topilmadi!',
    'auth/wrong-password':       'Parol noto\'g\'ri!',
    'auth/invalid-credential':   'Email yoki parol noto\'g\'ri!',
    'auth/too-many-requests':    'Juda ko\'p urinish! Biroz kuting.',
    'auth/network-request-failed':'Internet aloqasi yo\'q!',
    'auth/user-disabled':        'Bu hisob bloklangan!',
  })[code] || 'Xatolik yuz berdi. Qayta urinib ko\'ring.';
}
