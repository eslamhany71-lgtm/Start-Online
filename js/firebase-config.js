// استدعاء مكتبات فايربيز الأساسية
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// إعدادات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyCyypXt8LnHiVBR2Ka0Mb8ntXu6dJH9N-w",
  authDomain: "start-online-6f460.firebaseapp.com",
  databaseURL: "https://start-online-6f460-default-rtdb.firebaseio.com",
  projectId: "start-online-6f460",
  storageBucket: "start-online-6f460.firebasestorage.app",
  messagingSenderId: "343437561451",
  appId: "1:343437561451:web:2318fb3b90eb48fd0a6b2e"
};

// تهيئة الاتصال وتصديره لكل الصفحات
export const app = initializeApp(firebaseConfig); 
export const auth = getAuth(app); 
export const db = getDatabase(app);
