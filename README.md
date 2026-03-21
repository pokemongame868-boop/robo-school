# ROBO SCHOOL 🤖

Толық робототехника платформасы — Firebase + React + Vite + TailwindCSS

## Жылдам бастау

```bash
npm install
npm run dev
```

Сайт http://localhost:5173 мекенжайда ашылады.

## Firebase консолінде орнату

### 1. Firestore индекстері
Firebase Console → Firestore → Indexes → Add index:

| Collection | Field 1 | Field 2 | Query scope |
|------------|---------|---------|-------------|
| comments | stageId (Asc) | createdAt (Desc) | Collection |

### 2. Firestore ережелері
Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пайдаланушылар өз деректерін өзгерте алады
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Этаптарды тек admin оқи алады, жаза алады
    match /stages/{stageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.email == 'erulan@roboshool.kz';
    }
    // Пікірлерді барлығы оқи алады, тіркелгендер жаза алады
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null &&
        (resource.data.uid == request.auth.uid ||
         request.auth.token.email == 'erulan@roboshool.kz');
    }
  }
}
```

### 3. Admin аккаунты
`src/firebase/config.js` ішіндегі `ADMIN_EMAIL` мәнін Ерулан мұғалімнің нақты email-іне өзгертіңіз:
```js
export const ADMIN_EMAIL = 'erulan@roboshool.kz'; // ← мұны өзгерт
```

## Беттер

| Бет | URL | Кімге |
|-----|-----|-------|
| Лендинг | `/` | Тіркелмегендер |
| Курстар | `/courses` | Барлық тіркелгендер |
| Профиль | `/profile` | Барлық тіркелгендер |
| Қауымдастық | `/community` | Барлық тіркелгендер |
| Басқару | `/admin` | Тек Admin |

## Деплой (Vercel)

1. GitHub-қа жүктеңіз
2. vercel.com → Import Project → GitHub репозиторийді таңдаңыз
3. Deploy — бітті!
