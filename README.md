# WakeSnap - المنبه الذكي (بناء APK عبر GitHub)

## الطريقة
1. أنشئ مستودعًا جديدًا على GitHub (اسمه مثلًا `wakesnap`).
2. ارفع **كل محتويات** هذا المجلد (بما فيه `.github/workflows/build-apk.yml`).
   - لو رفع المجلد المخفي `.github` لم ينجح من الموقع: اختر `Add file ▸ Create new file`، اكتب الاسم `.github/workflows/build-apk.yml` والصق محتوى الملف.
3. (اختياري، للتحقق من الصور) `Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret`
   الاسم: `ANTHROPIC_API_KEY` والقيمة مفتاحك.
4. افتح تبويب **Actions ▸ Build Android APK ▸ Run workflow** (أو يبدأ تلقائيًا مع كل push على `main`).
5. بعد 15–25 دقيقة افتح التشغيل الناجح ونزّل **WakeSnap-apk** من قسم Artifacts، فك الضغط وثبّت `app-release.apk` على هاتفك (اسمح بالتثبيت من مصادر غير معروفة).

## ملاحظات
- المفتاح يُدمج داخل الـ APK، لا تشارك الملف علنًا. للنشر الحقيقي انقل التحقق إلى خادم.
- في أندرويد 12+ فعّل: الإشعارات، "المنبهات والتذكيرات"، واستثناء التطبيق من توفير البطارية ليرنّ في موعده.
- الـ APK موقّع بمفتاح تجريبي: مناسب للتثبيت المباشر، وليس للرفع على Google Play.
