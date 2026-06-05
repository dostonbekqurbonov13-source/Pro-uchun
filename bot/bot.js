// ===== InstaBazar.uz — Telegram Bot (Render/Webhook) =====
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express');

// ===== CONFIG =====
const BOT_TOKEN      = process.env.BOT_TOKEN;
const ADMIN_ID       = 8901786831;
const ADMIN_USERNAME = '@instabazar_admin';
const CLICK_CARD     = '4916 9903 5922 9462';
const CARD_NAME      = 'Qurbonov Dostonbek';
const SITE_URL       = 'https://instabazar.uz/instamarket';
const PORT           = process.env.PORT || 3000;
const RENDER_URL     = process.env.RENDER_URL || ''; // Render domain

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN kerak!');
  process.exit(1);
}

// ===== EXPRESS (Render uchun) =====
const app = express();
app.use(express.json());

// Health check — UptimeRobot shu ga ping yuboradi
app.get('/', (req, res) => {
  res.send('✅ InstaBazar Bot ishlayapti! ' + new Date().toLocaleString());
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'instabazar', time: new Date() });
});

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

// ===== BOT (Webhook yoki Polling) =====
let bot;
if (RENDER_URL) {
  // Render da — Webhook rejimi
  bot = new TelegramBot(BOT_TOKEN);
  const webhookUrl = RENDER_URL + '/bot' + BOT_TOKEN;
  bot.setWebHook(webhookUrl).then(() => {
    console.log('✅ Webhook ulandi:', webhookUrl);
  });
  app.post('/bot' + BOT_TOKEN, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
} else {
  // Local — Polling rejimi
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log('✅ Polling rejimida ishlamoqda');
}

// ===== FOYDALANUVCHI HOLATI =====
const userState = {};

// ===== /start =====
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name   = msg.from.first_name || 'Foydalanuvchi';

  // /start=acc_ID kelsa — account detail
  const match = msg.text.match(/\/start acc_(.+)/);
  if (match && db) {
    try {
      const doc = await db.collection('listings').doc(match[1]).get();
      if (doc.exists) {
        const a = { id: doc.id, ...doc.data() };
        userState[chatId] = { selectedAccount: a };
        await sendAccountDetail(chatId, a);
        return;
      }
    } catch(e) {}
  }

  await bot.sendMessage(chatId,
    `👋 Salom, *${name}*!\n\n` +
    `🛒 *InstaBazar.uz* — O'zbekistondagi birinchi Instagram account bozori!\n\n` +
    `✅ Tekshirilgan accountlar\n` +
    `🔒 Xavfsiz escrow to'lov\n` +
    `📦 10% komissiya\n\n` +
    `Nima qilmoqchisiz?`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

// ===== ACCOUNTLARNI KO'RISH =====
bot.onText(/📱 Accountlarni ko'rish/, async (msg) => {
  const chatId = msg.chat.id;

  if (!db) {
    await bot.sendMessage(chatId,
      `⚠️ Hozirda ma'lumotlar bazasi ulanmagan.\n\nSaytda ko'ring: [instabazar.uz](${SITE_URL})`,
      { parse_mode: 'Markdown', reply_markup: mainMenu() }
    );
    return;
  }

  const loadMsg = await bot.sendMessage(chatId, '⏳ Accountlar yuklanmoqda...');

  try {
    const snap   = await db.collection('listings').limit(100).get();
    const all    = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const active = all.filter(a => a.status === 'active');

    if (!active.length) {
      await bot.editMessageText(
        '😔 Hozircha aktiv accountlar yo\'q.\n\nTez orada yangilari qo\'shiladi!\n\n' +
        `🌐 Sayt: [instabazar.uz](${SITE_URL})`,
        { chat_id: chatId, message_id: loadMsg.message_id, parse_mode: 'Markdown', reply_markup: mainMenu() }
      );
      return;
    }

    await bot.editMessageText(
      `✅ *${active.length} ta account mavjud*\n\nQuyidan tanlang:`,
      { chat_id: chatId, message_id: loadMsg.message_id, parse_mode: 'Markdown' }
    );

    // Har 8 tadan guruh qilib yuborish (Telegram cheklovi)
    const chunks = [];
    for (let i = 0; i < active.length; i += 8) {
      chunks.push(active.slice(i, i + 8));
    }

    for (const chunk of chunks) {
      const buttons = chunk.map(a => [{
        text: `${a.emoji || '📱'} @${a.username} — ${fmtPrice(a.price)}`,
        callback_data: `acc_${a.id}`
      }]);
      await bot.sendMessage(chatId, '👇 Account tanlang:', {
        reply_markup: { inline_keyboard: buttons }
      });
    }
  } catch(e) {
    console.error(e);
    await bot.sendMessage(chatId, '❌ Xatolik. Qayta urinib ko\'ring yoki ' + ADMIN_USERNAME + ' bilan bog\'laning.');
  }
});

// ===== ACCOUNT DETAIL =====
async function sendAccountDetail(chatId, a) {
  const text =
    `${a.emoji || '📱'} *@${a.username}*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📌 Kategoriya: ${a.niche || a.category || '—'}\n` +
    `👥 Followers: *${fmtNum(a.followers)}*\n` +
    `❤️ Engagement Rate: *${a.er || 0}%*\n` +
    `📸 Postlar: ${a.posts || '—'}\n` +
    `📅 Yosh: ${a.age || '—'}\n` +
    `🌍 Auditoriya: ${a.audience || '—'}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💰 Narxi: *${fmtPrice(a.price)}*\n\n` +
    `📝 ${a.description || ''}`;

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: `🛒 Sotib olish — ${fmtPrice(a.price)}`, callback_data: `buy_${a.id}` }],
        [{ text: `🌐 Saytda ko'rish`, url: `${SITE_URL}/pages/account.html?id=${a.id}` }],
        [{ text: '◀️ Orqaga', callback_data: 'back_list' }]
      ]
    }
  });
}

// ===== CALLBACK QUERY =====
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data   = query.data;

  // Account ko'rish
  if (data.startsWith('acc_')) {
    const id = data.replace('acc_', '');
    if (!db) { await bot.answerCallbackQuery(query.id, { text: 'Firebase ulanmagan!' }); return; }
    try {
      const doc = await db.collection('listings').doc(id).get();
      if (!doc.exists) { await bot.answerCallbackQuery(query.id, { text: 'Account topilmadi!' }); return; }
      const a = { id: doc.id, ...doc.data() };
      userState[chatId] = { selectedAccount: a };
      await sendAccountDetail(chatId, a);
    } catch(e) { console.error(e); }
    await bot.answerCallbackQuery(query.id);
    return;
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
      `✅ To'lov qilgandan keyin *chek rasmini* shu yerga yuboring!\n` +
      `⏰ Kutish vaqti: 30 daqiqa`,
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
    return;
  }

  // Chek yuborish
  if (data.startsWith('check_')) {
    userState[chatId] = { ...userState[chatId], waitingCheck: true };
    await bot.sendMessage(chatId, '📸 To\'lov chekining rasmini yuboring:',
      { reply_markup: { remove_keyboard: true } }
    );
    await bot.answerCallbackQuery(query.id);
    return;
  }

  // Admin — Tasdiqlash
  if (data.startsWith('confirm_')) {
    const parts = data.split('_');
    const buyerChatId = parseInt(parts[1]);
    const accId  = parts[2];
    const orderId = parts[3];
    if (db) {
      try {
        await db.collection('orders').add({
          listingId: accId, orderId, buyerChatId,
          status: 'paid_confirmed',
          confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) {}
    }
    await bot.sendMessage(chatId, `✅ *#${orderId}* tasdiqlandi!`, { parse_mode: 'Markdown' });
    await bot.sendMessage(buyerChatId,
      `🎉 *To'lovingiz tasdiqlandi!*\n\nBuyurtma: *#${orderId}*\n\n` +
      `Admin tez orada account ma'lumotlarini yuboradi.\n⏰ 24 soat ichida.`,
      { parse_mode: 'Markdown' }
    );
    await bot.answerCallbackQuery(query.id, { text: '✅ Tasdiqlandi!' });
    return;
  }

  // Admin — Rad
  if (data.startsWith('reject_')) {
    const buyerChatId = parseInt(data.split('_')[1]);
    await bot.sendMessage(buyerChatId,
      `❌ *To'lov tasdiqlanmadi.*\n\nQayta to'lab chek yuboring yoki ${ADMIN_USERNAME} bilan bog'laning.`,
      { parse_mode: 'Markdown' }
    );
    await bot.answerCallbackQuery(query.id, { text: '❌ Rad etildi' });
    return;
  }

  // Orqaga
  if (data === 'back_list') {
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, 'Accountlar ro\'yxatiga qaytish uchun tugmani bosing:',
      { reply_markup: mainMenu() }
    );
    return;
  }

  // Bekor
  if (data === 'cancel') {
    userState[chatId] = {};
    await bot.sendMessage(chatId, '❌ Bekor qilindi.', { reply_markup: mainMenu() });
    await bot.answerCallbackQuery(query.id);
    return;
  }
});

// ===== CHEK RASM =====
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state  = userState[chatId];
  if (!state?.waitingCheck) return;

  const acc     = state.selectedAccount;
  const orderId = state.orderId;
  const userName = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
  const photoId  = msg.photo[msg.photo.length - 1].file_id;

  const caption =
    `💰 *YANGI BUYURTMA!*\n\n` +
    `📦 Buyurtma: *#${orderId}*\n` +
    `👤 Xaridor: ${userName} (ID: \`${chatId}\`)\n` +
    `📱 Account: *@${acc?.username || '—'}*\n` +
    `💵 Summa: *${acc ? fmtPrice(acc.price) : '—'}*\n\n` +
    `Tasdiqlang yoki rad eting:`;

  await bot.sendPhoto(ADMIN_ID, photoId, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Tasdiqlash', callback_data: `confirm_${chatId}_${acc?.id || ''}_${orderId}` },
        { text: '❌ Rad etish', callback_data: `reject_${chatId}` }
      ]]
    }
  });

  userState[chatId] = { ...state, waitingCheck: false };

  await bot.sendMessage(chatId,
    `✅ *Chek qabul qilindi!*\n\nBuyurtma: *#${orderId}*\n\nAdmin 15-30 daqiqa ichida tekshiradi.\nSavol: ${ADMIN_USERNAME}`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

// ===== MENU HANDLERS =====
bot.onText(/💰 Account sotish/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `💰 *Account sotish*\n\n` +
    `Account sotish uchun saytga kiring:\n👉 [instabazar.uz](${SITE_URL}/pages/sell.html)\n\n` +
    `Yoki admin bilan bog'laning:\n👤 ${ADMIN_USERNAME}`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

bot.onText(/📞 Operator/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `📞 *Operator*\n\n👤 ${ADMIN_USERNAME}\n⏰ 9:00 — 22:00\n\nSavollaringizni yozing!`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

bot.onText(/❓ Yordam/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `❓ *Yordam*\n\n` +
    `🌐 [instabazar.uz](${SITE_URL})\n👤 ${ADMIN_USERNAME}\n\n` +
    `*Savollar:*\n\n` +
    `❔ Account xavfsizmi?\n✅ Ha, moderatsiyadan o'tadi\n\n` +
    `❔ To'lovdan keyin account kelmasa?\n✅ Pul qaytariladi\n\n` +
    `❔ Qancha kutish kerak?\n✅ 24 soat ichida`,
    { parse_mode: 'Markdown', reply_markup: mainMenu() }
  );
});

// ===== HELPERS =====
function mainMenu() {
  return {
    keyboard: [
      ['📱 Accountlarni ko\'rish', '💰 Account sotish'],
      ['📞 Operator', '❓ Yordam']
    ],
    resize_keyboard: true
  };
}
function fmtPrice(p) {
  if (!p) return '—';
  if (p >= 1000000) return (p/1000000).toFixed(1) + ' mln so\'m';
  if (p >= 1000)    return Number(p).toLocaleString() + ' so\'m';
  return p + ' so\'m';
}
function fmtNum(n) {
  if (!n) return '—';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n;
}

// ===== SERVER START =====
app.listen(PORT, () => {
  console.log(`✅ InstaBazar Bot server ${PORT} portda ishlamoqda`);
});
