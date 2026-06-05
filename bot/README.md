# InstaBazar Telegram Bot

## Sozlash:

### 1. Firebase Service Account olish:
```
console.firebase.google.com
→ instamarket-uz
→ Project Settings (⚙️)
→ Service accounts
→ "Generate new private key"
→ JSON faylni yuklab oling
→ bot/ papkasiga "serviceAccount.json" nomi bilan saqlang
```

### 2. .env fayl yarating:
```
BOT_TOKEN=8550658687:AAFXmWYU13XoEHB36PTqQhr5JEkZc-t-9nM
```

### 3. O'rnatish:
```bash
cd bot
npm install
node bot.js
```

### 4. 24/7 ishlatish uchun (Railway.app):
```
railway.app → New Project → Deploy from GitHub
→ bot/ papkasini tanlang
→ BOT_TOKEN env variable qo'shing
→ Deploy!
```
