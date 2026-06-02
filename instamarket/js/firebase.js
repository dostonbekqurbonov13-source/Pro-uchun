// ===== InstaMarket.uz — Firebase Config =====
// Firebase v9 compat (CDN orqali ishlaydi)

const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyReplaceWithYours",
  authDomain: "instamarket-uz.firebaseapp.com",
  projectId: "instamarket-uz",
  storageBucket: "instamarket-uz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Firebase ni boshlash
let app, auth, db;

function initFirebase() {
  try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db   = firebase.firestore();

    // Offline cache yoqish (internet uzilsa ham ishlaydi)
    db.enablePersistence().catch(function(err) {
      if (err.code === 'failed-precondition') {
        console.log('Offline cache: bir nechta tab ochiq');
      } else if (err.code === 'unimplemented') {
        console.log('Brauzer offline cacheni qo\'llab-quvvatlamaydi');
      }
    });

    console.log('✅ Firebase ulandi');
    return true;
  } catch (e) {
    console.warn('⚠️ Firebase ulanmadi, demo rejimda ishlayapti:', e.message);
    return false;
  }
}

// ===== AUTH FUNKSIYALAR =====

// Ro'yxatdan o'tish
async function registerUser(email, password, name, role) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });

    // Foydalanuvchi ma'lumotlarini Firestore ga saqlash
    await db.collection('users').doc(cred.user.uid).set({
      uid:       cred.user.uid,
      name:      name,
      email:     email,
      role:      role,        // 'buyer' | 'seller' | 'admin'
      status:    'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      sales:     0,
      rating:    5.0,
      avatar:    '',
    });

    // LocalStorage ga ham saqlash (tezkor yuklash uchun)
    saveUserLocal({ uid: cred.user.uid, name, email, role });
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: firebaseErrorUz(e.code) };
  }
}

// Kirish
async function loginUser(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);

    // Firestore dan user ma'lumotlarini olish
    const doc = await db.collection('users').doc(cred.user.uid).get();
    if (doc.exists) {
      const data = doc.data();
      saveUserLocal({ uid: cred.user.uid, name: data.name, email: data.email, role: data.role });
      return { success: true, user: data };
    }
    return { success: true, user: { uid: cred.user.uid, email, role: 'buyer', name: email.split('@')[0] } };
  } catch (e) {
    return { success: false, error: firebaseErrorUz(e.code) };
  }
}

// Chiqish
async function logoutUser() {
  try {
    await auth.signOut();
  } catch (e) {}
  localStorage.removeItem('im_user');
}

// Parolni tiklash
async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return { success: true };
  } catch (e) {
    return { success: false, error: firebaseErrorUz(e.code) };
  }
}

// Auth holat kuzatish
function onAuthStateChange(callback) {
  if (!auth) { callback(null); return; }
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          saveUserLocal({ uid: user.uid, name: data.name, email: data.email, role: data.role });
          callback(data);
        } else {
          callback({ uid: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0], role: 'buyer' });
        }
      } catch (e) {
        callback({ uid: user.uid, email: user.email, name: user.displayName || '', role: 'buyer' });
      }
    } else {
      callback(null);
    }
  });
}

// ===== FIRESTORE FUNKSIYALAR =====

// E'lon qo'shish (sotuvchi)
async function addListing(data) {
  try {
    const user = loadUser();
    if (!user) return { success: false, error: 'Kirish talab qilinadi' };

    const docRef = await db.collection('listings').add({
      ...data,
      uid:       user.uid,
      sellerName: user.name,
      status:    'pending',   // pending | active | sold | rejected
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      views:     0,
      saves:     0,
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// E'lonlarni olish
async function getListings(filters) {
  try {
    filters = filters || {};
    let query = db.collection('listings').where('status', '==', 'active');

    if (filters.category && filters.category !== 'all') {
      query = query.where('category', '==', filters.category);
    }
    if (filters.maxPrice) {
      query = query.where('price', '<=', filters.maxPrice);
    }

    query = query.orderBy('createdAt', 'desc').limit(50);
    const snap = await query.get();
    return snap.docs.map(function(d) { return { id: d.id, ...d.data() }; });
  } catch (e) {
    console.warn('getListings xato:', e);
    return [];
  }
}

// Bitta e'lon olish
async function getListing(id) {
  try {
    const doc = await db.collection('listings').doc(id).get();
    if (doc.exists) return { id: doc.id, ...doc.data() };
    return null;
  } catch (e) {
    return null;
  }
}

// Ko'rishlar sonini oshirish
async function incrementViews(id) {
  try {
    await db.collection('listings').doc(id).update({
      views: firebase.firestore.FieldValue.increment(1)
    });
  } catch (e) {}
}

// Chat xabar yuborish
async function sendChatMessage(listingId, message) {
  try {
    const user = loadUser();
    if (!user) return { success: false, error: 'Kirish talab qilinadi' };

    // Tashqi aloqa filtri
    const forbidden = ['telegram', 't.me', 'whatsapp', '@gmail', 'tel:', 'instagram.com', 'phone', 'telefon'];
    const msgLower = message.toLowerCase();
    for (const word of forbidden) {
      if (msgLower.includes(word)) {
        return { success: false, error: 'Tashqi aloqa ma\'lumotlari taqiqlanadi! Faqat sayt ichida muloqot.' };
      }
    }

    await db.collection('chats').doc(listingId).collection('messages').add({
      text:      message,
      uid:       user.uid,
      name:      user.name,
      role:      user.role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Chat xabarlarini tinglash (real-time)
function listenChat(listingId, callback) {
  if (!db) return function() {};
  return db.collection('chats').doc(listingId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(function(snap) {
      const msgs = snap.docs.map(function(d) { return { id: d.id, ...d.data() }; });
      callback(msgs);
    });
}

// Savdo yaratish
async function createOrder(listingId, paymentMethod) {
  try {
    const user = loadUser();
    if (!user) return { success: false, error: 'Kirish talab qilinadi' };

    const listing = await getListing(listingId);
    if (!listing) return { success: false, error: 'E\'lon topilmadi' };

    const orderRef = await db.collection('orders').add({
      listingId:     listingId,
      listingTitle:  listing.username || '',
      buyerUid:      user.uid,
      buyerName:     user.name,
      sellerUid:     listing.uid || '',
      sellerName:    listing.sellerName || '',
      amount:        listing.price,
      commission:    Math.round(listing.price * 0.12),
      paymentMethod: paymentMethod,
      status:        'escrow',   // escrow | checking | done | dispute | refunded
      createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
      checkDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 soat
    });

    // E'lon statusini o'zgartirish
    await db.collection('listings').doc(listingId).update({ status: 'sold' });

    return { success: true, orderId: orderRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Admin: e'lonni tasdiqlash/rad etish
async function moderateListing(listingId, action, reason) {
  try {
    await db.collection('listings').doc(listingId).update({
      status:    action,  // 'active' | 'rejected'
      moderatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      rejectReason: reason || '',
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Admin: statistika olish
async function getAdminStats() {
  try {
    const [users, listings, orders] = await Promise.all([
      db.collection('users').get(),
      db.collection('listings').get(),
      db.collection('orders').get(),
    ]);

    const pendingListings = listings.docs.filter(function(d) { return d.data().status === 'pending'; }).length;
    const activeListings  = listings.docs.filter(function(d) { return d.data().status === 'active'; }).length;
    const totalOrders     = orders.docs.length;
    const totalRevenue    = orders.docs.reduce(function(sum, d) {
      return sum + (d.data().commission || 0);
    }, 0);

    return {
      totalUsers:      users.size,
      totalListings:   listings.size,
      pendingListings: pendingListings,
      activeListings:  activeListings,
      totalOrders:     totalOrders,
      totalRevenue:    totalRevenue,
    };
  } catch (e) {
    return { totalUsers: 0, totalListings: 0, pendingListings: 0, activeListings: 0, totalOrders: 0, totalRevenue: 0 };
  }
}

// ===== YORDAMCHI FUNKSIYALAR =====

function saveUserLocal(user) {
  localStorage.setItem('im_user', JSON.stringify(user));
}

function loadUser() {
  try { return JSON.parse(localStorage.getItem('im_user') || 'null'); } catch { return null; }
}

// Firebase xato xabarlarini O'zbekchaga tarjima
function firebaseErrorUz(code) {
  const errors = {
    'auth/email-already-in-use':    'Bu email allaqachon ro\'yxatdan o\'tgan!',
    'auth/invalid-email':           'Email noto\'g\'ri formatda!',
    'auth/weak-password':           'Parol juda zaif! Kamida 6 ta belgi.',
    'auth/user-not-found':          'Bu email bilan hisob topilmadi!',
    'auth/wrong-password':          'Parol noto\'g\'ri!',
    'auth/too-many-requests':       'Juda ko\'p urinish! Biroz kuting.',
    'auth/network-request-failed':  'Internet aloqasi yo\'q!',
    'auth/user-disabled':           'Bu hisob bloklangan!',
    'permission-denied':            'Ruxsat yo\'q!',
  };
  return errors[code] || 'Xatolik yuz berdi. Qayta urinib ko\'ring.';
}

// Demo rejim uchun (Firebase ulanmagan bo'lsa)
function demoLogin(role) {
  const users = {
    buyer:  { uid: 'demo-buyer',  name: 'Demo Xaridor', email: 'buyer@demo.uz',  role: 'buyer'  },
    seller: { uid: 'demo-seller', name: 'Demo Sotuvchi', email: 'seller@demo.uz', role: 'seller' },
    admin:  { uid: 'demo-admin',  name: 'Admin',         email: 'admin@instamarket.uz', role: 'admin'  },
  };
  const user = users[role] || users.buyer;
  saveUserLocal(user);
  return user;
}
