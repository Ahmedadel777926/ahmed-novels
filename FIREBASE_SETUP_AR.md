# إعداد Firebase للموقع

النسخة الجديدة تحافظ على شكل الموقع الحالي، وتضيف لوحة تحكم في `admin.html`.

## 1) إنشاء مشروع Firebase
1. افتح Firebase Console.
2. أنشئ مشروعًا جديدًا باسم مثل `ahmed-novels`.
3. أضف Web App من إعدادات المشروع.
4. انسخ إعدادات `firebaseConfig` وضعها داخل `firebase-config.js` بدل القيم الوهمية.

## 2) تسجيل دخول الأدمن
1. Firebase Console → Authentication → Get started.
2. فعّل Email/Password.
3. أضف بريدك وكلمة المرور من Users.

## 3) قاعدة البيانات
فعّل Firestore Database.
استخدم قواعد `firestore.rules` الموجودة هنا.

## 4) الصور
فعّل Storage.
استخدم قواعد `storage.rules` الموجودة هنا.

## 5) لوحة التحكم
بعد رفع الموقع على GitHub Pages افتح:
`https://YOUR-USERNAME.github.io/YOUR-REPO/admin.html`
وسجّل الدخول بحساب Firebase الذي أنشأته.

من هناك تقدر تضيف الروايات والفصول والشخصيات والصور بدون تعديل ملفات الموقع.

## ملاحظة أمان
`firebase-config.js` الخاص بتطبيق الويب ليس مكانًا لمفاتيح Service Account. لا تضع أي private key أو ملف service account في الموقع.
