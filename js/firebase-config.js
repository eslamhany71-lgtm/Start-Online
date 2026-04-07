// 1. هنا بنستدعي (Import) الأدوات اللي محتاجينها من شركة جوجل
// initializeApp: دي الأداة اللي بتصحي المشروع وتوقفه على رجله
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// getAuth: دي الأداة المسئولة عن تسجيل الدخول والباسوردات
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// getDatabase: دي الأداة المسئولة عن حفظ وقراية البيانات (المنتجات، الطلبات)
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. دي "البطاقة الشخصية" بتاعة مشروعك اللي إنت لسه باعتها
const firebaseConfig = {
  apiKey: "AIzaSyCyypXt8LnHiVBR2Ka0Mb8ntXu6dJH9N-w",
  authDomain: "start-online-6f460.firebaseapp.com",
  databaseURL: "https://start-online-6f460-default-rtdb.firebaseio.com",
  projectId: "start-online-6f460",
  storageBucket: "start-online-6f460.firebasestorage.app",
  messagingSenderId: "343437561451",
  appId: "1:343437561451:web:2318fb3b90eb48fd0a6b2e"
};

// 3. هنا بقى السحر (export)
// كلمة export معناها "صدّر أو طلّع بره". يعني بنجهز الأدوات دي عشان أي صفحة تانية في الموقع تاخدها على الجاهز
export const app = initializeApp(firebaseConfig); // شغلنا المشروع
export const auth = getAuth(app); // جهزنا نظام الدخول
export const db = getDatabase(app); // جهزنا قاعدة البيانات
