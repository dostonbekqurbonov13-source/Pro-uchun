# InstaBazar Telegram Bot

Bu botni **noutbukда (lokal)** yoki **serverда (24/7)** ishga tushirish mumkin.

---

## 💻 Noutbukда ishga tushirish (BEPUL)

> Bot noutbuk yoniq turganда ishlaydi. Noutbukni o'chirsangiz yoki terminal yopilsa — bot to'xtaydi.

### 1-qadam: Node.js o'rnatish
[nodejs.org](https://nodejs.org) ga kiring → **LTS** versiyani yuklab oling va o'rnating.
Tekshirish (terminal/cmd da):
```bash
node -v
```

### 2-qadam: Kodni yuklab olish
GitHub'dan `Pro-uchun` repozitoriyni yuklab oling (Code → Download ZIP) yoki:
```bash
git clone https://github.com/dostonbekqurbonov13-source/Pro-uchun.git
```

### 3-qadam: Firebase kalitini qo'shish
```
console.firebase.google.com → instamarket-uz
→ Project Settings (⚙️) → Service accounts
→ "Generate new private key" → JSON yuklab oling
→ bot/ papkasiga "serviceAccount.json" nomi bilan saqlang
```

### 4-qadam: .env fayl yaratish
`bot/` papkasida `.env.example` dan nusxa olib `.env` nomli fayl yarating va tokenni yozing:
```
BOT_TOKEN=BotFatherdan_olgan_tokeningiz
```
> ⚠️ Tokenni hech qachon ochiq joyga (README, kod, GitHub) yozmang!

### 5-qadam: O'rnatish va ishga tushirish
```bash
cd bot
npm install
npm start
```
Terminalда `✅ Polling rejimida ishlamoqda` chiqsa — bot tayyor! 🎉
Telegram'da botingizga `/start` yozib tekshiring.

> Botni to'xtatish: terminalда `Ctrl + C`.

---

## ☁️ 24/7 ishlatish (server kerak bo'lganда)

Render yoki Railway'ga deploy qiling, `BOT_TOKEN` va `GOOGLE_CREDENTIALS` (serviceAccount JSON matni) ni env o'zgaruvchi sifatida qo'shing. Render uchun `RENDER_URL` ni ham qo'shsangiz, bot Webhook rejimida ishlaydi.

---

## 🔒 Xavfsizlik
- `.env` va `serviceAccount.json` fayllari `.gitignore` orqali GitHub'ga **yuklanmaydi**.
- Token oldin ochiq yozilган bo'lsa, [@BotFather](https://t.me/BotFather) da `/revoke` orqali yangilang.
