// يُستخدم داخل GitHub Actions
//   node configure.js app     ← يضبط app.json (الاسم، الحزمة، الأذونات، الإضافات)
//   node configure.js native  ← بعد prebuild: يفعّل RTL أصليًا في تطبيق أندرويد
const fs = require('fs');
const path = require('path');
const mode = process.argv[2];

if (mode === 'app') {
  const f = 'app.json';
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const e = j.expo;
  e.name = 'WakeSnap';
  e.slug = 'wakesnap';
  e.version = '1.0.0';
  e.orientation = 'portrait';
  e.userInterfaceStyle = 'dark';
  e.android = {
    ...(e.android || {}),
    package: 'com.wakesnap.app',
    permissions: ['CAMERA', 'VIBRATE', 'POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED', 'SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM'],
  };
  e.plugins = [
    ...(e.plugins || []),
    'expo-notifications',
    ['expo-camera', { cameraPermission: 'نحتاج الكاميرا للتحقق من مهمة الصورة' }],
  ];
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
  console.log('app.json configured');
}

if (mode === 'native') {
  const find = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => {
    const p = path.join(d, x.name);
    return x.isDirectory() ? find(p) : /MainApplication\.(kt|java)$/.test(x.name) ? [p] : [];
  });
  const [file] = find('android/app/src/main');
  if (!file) { console.warn('MainApplication not found, RTL not forced'); process.exit(0); }
  let s = fs.readFileSync(file, 'utf8');
  const isKt = file.endsWith('.kt');
  const code = isKt
    ? 'com.facebook.react.modules.i18nmanager.I18nUtil.getInstance().let { it.allowRTL(this, true); it.forceRTL(this, true) }'
    : 'com.facebook.react.modules.i18nmanager.I18nUtil.getInstance().allowRTL(this, true); com.facebook.react.modules.i18nmanager.I18nUtil.getInstance().forceRTL(this, true);';
  const marker = isKt ? 'super.onCreate()' : 'super.onCreate();';
  if (s.includes(marker) && !s.includes('forceRTL')) {
    s = s.replace(marker, marker + '\n    ' + code);
    fs.writeFileSync(file, s);
    console.log('RTL forced in', file);
  } else console.warn('onCreate marker not found, RTL not forced');
}
