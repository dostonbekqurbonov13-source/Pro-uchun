// ===== InstaBazar.uz — Telegram Bot =====
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// ===== CONFIG =====
const BOT_TOKEN      = process.env.BOT_TOKEN;
const ADMIN_ID       = 8901786831;
const ADMIN_USERNAME = '@instabazar_admin';
const CLICK_CARD     = '4916 9903 5922 9462';
const CARD_NAME      = 'Qurbonov Dostonbek';
const SITE_URL       = 'https://instabazar.uz/instamarket';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN env variable kerak!');
  process.exit(1);
}

// ===== FIREBASE =====
let db = null;
try {
  let cred;
  if (process.env.GOOGLE_CREDENTIALS) {
    const sa = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    cred = admin.credential.cert(sa);
  } else {
    try {
      const sa = require('./serviceAccount.json');
      cred = admin.credential.cert(sa);
    } catch(e) {
      console.warn('⚠️ serviceAccount.json topilmadi');
      cred = null;
    }
  }
  if (cred) {
    admin.initializeApp({ credential: cred });
    db = admin.firestore();
    console.log('✅ Firebase ulandi!');
  }
} catch(e) {
  console.warn('⚠️ Firebase ulanmadi:', e.message);
}

// ===== BOT =====
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Foydalanuvchi holati
const userState = {};

// ===== /start =====
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name   = msg.from.first_name || 'Foydalanuvchi';

  await bot.sendMessage(chatId,
    `👋 Salom, *${name}*!\n\n` +
    `🛒 *InstaBazar.uz* — O'zbekistondagi birinchi Instagram account bozori!\n\n` +
    `Nima qilmoqchisiz?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          ['📱 Accountlarni ko\'rish', '💰 Account sotish'],
          ['📞 Operator bilan bog\'lanish', '❓ Yordam']
        ],
        resize_keyboard: true
      }
    }
  );
});

// ===== ACCOUNTLARNI KO'RISH =====
bot.onText(/📱 Accountlarni ko'rish/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, '⏳ Accountlar yuklanmoqda...');

  try {
    const snap = await db.collection('listings').limit(50).get();
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const active = all.filter(a => a.status === 'active');

    if (!active.length) {
      await bot.sendMessage(chatId,
        '😔 Hozircha aktiv accountlar yo\'q.\n\nTez orada yangilari qo\'shiladi!',
        { reply_markup: mainMenu() }
      );
      return;
    }

    await bot.sendMessage(chatId,
      `✅ *${active.length} ta account topildi*\n\nQuyidagilardan birini tanlang:`,
      { parse_mode: 'Markdown' }
    );

    // Kategoriya bo'yicha guruhlash
    const cats = {};
    active.forEach(a => {
      const cat = a.category || 'other';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(a);
    });

    // Inline buttons
    const buttons = active.map(a => [{
      text: `${a.emoji || '📱'} @${a.username} — ${fmtPrice(a.price)}`,
      callback_data: `acc_${a.id}`
    }]);

    await bot.sendMessage(chatId,
      '👇 Account tanlang:',
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );
  } catch(e) {
    console.error(e);
    await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qayta urinib ko\'ring.');
  }
});

// ===== ACCOUNT DETAIL =====
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data   = query.data;

  // Account ko'rish
  if (data.startsWith('acc_')) {
    const id  = data.replace('acc_', '');
    try {
      const doc = await db.collection('listings').doc(id).get();
      if (!doc.exists) {
        await bot.answerCallbackQuery(query.id, { text: 'Account topilmadi!' });
        return;
      }
      const a = { id: doc.id, ...doc.data() };
      userState[chatId] = { selectedAccount: a };

      const text =
        `${a.emoji || '📱'} *@${a.username}*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📌 Kategoriya: ${a.niche || a.category}\n` +
        `👥 Followers: *${fmtNum(a.followers)}*\n` +
        `❤️ Engagement Rate: *${a.er}%*\n` +
        `📸 Postlar: ${a.posts}\n` +
        `📅 Yosh: ${a.age}\n` +
        `🌍 Auditoriya: ${a.audience}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 Narxi: *${fmtPrice(a.price)}*\n\n` +
        `📝 ${a.description || ''}`;

      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `🛒 Sotib olish — ${fmtPrice(a.price)}`, callback_data: `buy_${a.id}` }],
            [{ text: '◀️ Orqaga', callback_data: 'back_list' }]
          ]
        }
      });
    } catch(e) {
      console.error(e);
    }
    await bot.answerCallbackQuery(query.id);
  }

  // Sotib olish
  if (data.startsWith('buy_')) {
    const id  = data.replace('buy_', '');
    const acc = userState[chatId]?.selectedAccount;

    const orderId = 'ORD' + Date.now().toString().slice(-6);
    userState[chatId] = { ...userState[chatId], orderId, buyingId: id };

    await bot.sendMessage(chatId,
      `✅ *Ajoyib tanlov!*\n\n` +
      `📦 Buyurtma raqami: *#${orderId}*\n` +
      `💰 To'lov summasi: *${acc ? fmtPrice(acc.price) : '—'}*\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💳 *To'lov ma'lumotlari:*\n\n` +
      `Click karta: \`${CLICK_CARD}\`\n` +
      `Ism: ${CARD_NAME}\n\n` +
      `📝 *Izoh qatoriga yozing:*\n` +
      `\`InstaBazar #${orderId}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✅ To'lov qilgandan keyin *chek rasmini* shu yerga yuboring!\n\n` +
      `⏰ To'lov kutish vaqti: 30 daqiqa`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📸 Chek yuborish', callback_data: `check_${id}` }],
            [{ text: '❌ Bekor qilish', callback_data: 'cancel' }]
          ]
        }
      }
    );
    await bot.answerCallbackQuery(query.id);
  }

  // Chek yuborish
  if (data.startsWith('check_')) {
    userState[chatId] = { ...userState[chatId], waitingCheck: true };
    await bot.sendMessage(chatId,
      '📸 To\'lov chekining rasmini yuboring:',
      { reply_markup: { remove_keyboard: true } }
    );
    await bot.answerCallbackQuery(query.id);
  }

  // Orqaga
  if (data === 'back_list') {
    await bot.answerCallbackQuery(query.id);
    // Accountlar ro'yxatini qayta ko'rsatish
    bot.emit('message', { ...query.message, text: '📱 Accountlarni ko\'rish' });
  }

  // Bekor qilish
  if (data === 'cancel') {
    userState[chatId] = {};
    await bot.sendMessage(chatId, '❌ Buyurtma bekor qilindi.', { reply_markup: mainMenu() });
    await bot.answerCallbackQuery(query.id);
  }

  // Admin — Tasdiqlash
  if (data.startsWith('confirm_')) {
    const parts   = data.split('_');
    const buyerChatId = parseInt(parts[1]);
    const accId   = parts[2];
    const orderId = parts[3];

    try {
      await db.collection('orders').add({
        listingId: accId, orderId,
        buyerChatId, status: 'paid_confirmed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) {}

    await bot.sendMessage(chatId, `✅ *#${orderId}* tasdiqlandi! Sotuvchi bilan bog'lanilmoqda...`, { parse_mode: 'Markdown' });
    await bot.sendMessage(buyerChatId,
      `🎉 *To'lovingiz tasdiqlandi!*\n\n` +
      `Buyurtma: *#${orderId}*\n\n` +
      `Admin tez orada siz bilan bog'lanadi va account ma'lumotlarini yuboradi.\n\n` +
      `⏰ 24 soat ichida javob beriladi.`,
      { parse_mode: 'Markdown' }
    );
    await bot.answerCallbackQuery(query.id, { text: '✅ Tasdiqlandi!' });
  }

  // Admin — Rad etish
  if (data.startsWith('reject_')) {
    const buyerChatId = parseInt(data.split('_')[1]);
    await bot.sendMessage(buyerChatId,
      `❌ *To'lov tasdiqlanmadi.*\n\nIltimos, qayta to'lab chek yuboring yoki ${ADMIN_USERNAME} bilan bog'laning.`,
      { parse_mode: 'Markdown' }
    );
    await bot.answerCallbackQuery(query.id, { text: '❌ Rad etildi' });
  }
});

// ===== RASM/CHEK YUBORISH =====
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state  = userState[chatId];

  if (!state?.waitingCheck) return;

  const acc     = state.selectedAccount;
  const orderId = state.orderId;
  const userName = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

  // Adminга xabar
  const caption =
    `💰 *YANGI BUYURTMA!*\n\n` +
    `📦 Buyurtma: *#${orderId}*\n` +
    `👤 Xaridor: ${userName} (ID: ${chatId})\n` +
    `📱 Account: *@${acc?.username || '—'}*\n` +
    `💵 Summa: *${acc ? fmtPrice(acc.price) : '—'}*\n\n` +
    `Chek rasmini ko'ring va tasdiqlang:`;

  const photoId = msg.photo[msg.photo.length - 1].file_id;

  await bot.sendPhoto(ADMIN_ID, photoId, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Tasdiqlash', callback_data: `confirm_${chatId}_${acc?.id || ''}_${orderId}` },
          { text: '❌ Rad etish', callback_data: `reject_${chatId}` }
        ]
      ]
    }
  });

  userState[chatId] = { ...state, waitingCheck: false, checkSent: true };

  await bot.sendMessage(chatId,
    `✅ *Chek qabul qilindi!*\n\n` +
    `Buyurtma: *#${orderId}*\n\n` +
    `Admin 15-30 daqiqa ichida tekshiradi va tasdiqlaydi.\n\n` +
    `Savol bo'lsa: ${ADMIN_USERNAME}`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu()
    }
  );
});

// ===== ACCOUNT SOTISH =====
bot.onText(/💰 Account sotish/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `💰 *Account sotish*\n\n` +
    `Account sotish uchun saytimizga kiring:\n\n` +
    `👉 [instabazar.uz](${SITE_URL}/pages/sell.html)\n\n` +
    `Yoki admin bilan to'g'ridan bog'laning:\n` +
    `👤 ${ADMIN_USERNAME}`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

// ===== YORDAM =====
bot.onText(/❓ Yordam/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `❓ *Yordam*\n\n` +
    `🌐 Sayt: [instabazar.uz](${SITE_URL})\n` +
    `👤 Admin: ${ADMIN_USERNAME}\n\n` +
    `*Ko'p so'raladigan savollar:*\n\n` +
    `❔ Account xavfsizmi?\n` +
    `✅ Ha! Barcha accountlar moderatsiyadan o'tadi\n\n` +
    `❔ To'lovdan keyin account kelmasa?\n` +
    `✅ Pul to'liq qaytariladi\n\n` +
    `❔ Qancha vaqt kutish kerak?\n` +
    `✅ To'lov tasdiqlangach 24 soat ichida`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

// ===== OPERATOR =====
bot.onText(/📞 Operator bilan bog'lanish/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `📞 *Operator bilan bog\'lanish*\n\n` +
    `👤 Admin Telegram: ${ADMIN_USERNAME}\n` +
    `⏰ Ish vaqti: 9:00 — 22:00\n\n` +
    `Savollaringizni yozing!`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

// ===== HELPERS =====
function mainMenu() {
  return {
    keyboard: [
      ['📱 Accountlarni ko\'rish', '💰 Account sotish'],
      ['📞 Operator bilan bog\'lanish', '❓ Yordam']
    ],
    resize_keyboard: true
  };
}

function fmtPrice(p) {
  if (!p) return '—';
  if (p >= 1000000) return (p/1000000).toFixed(1) + ' mln so\'m';
  if (p >= 1000)    return p.toLocaleString() + ' so\'m';
  return p + ' so\'m';
}

function fmtNum(n) {
  if (!n) return '—';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n;
}

console.log('✅ InstaBazar Bot ishga tushdi!');
