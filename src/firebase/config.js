import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAZNYin9upn_sl2NhsSBNeJ4wAWY5kzKDg",
  authDomain: "robo-school-f82f3.firebaseapp.com",
  projectId: "robo-school-f82f3",
  storageBucket: "robo-school-f82f3.firebasestorage.app",
  messagingSenderId: "2763092084",
  appId: "1:2763092084:web:83acb1adc79e4394e5e121",
  measurementId: "G-GRZZPV42L5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Admin email - только этот аккаунт может добавлять материалы
export const ADMIN_EMAIL = 'admin@gmail.com';

export default app;
