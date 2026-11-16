// إصلاح: بعض وحدات Expo الأساسية (expo, expo-asset, expo-constants, expo-modules-core)
// تفتقد حقل version في publication فيفشل Gradle. هذا السكربت يضيفه من package.json.
// الاستخدام داخل build-app:  node ../scripts/fix-publication.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// يمرّ على كل كائن publication داخل الإعداد ويضيف version إن كان ناقصًا
function patchCfg(node, version) {
  let changed = false;
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'publication' && v && typeof v === 'object' && !v.version) { v.version = version; changed = true; }
      else if (patchCfg(v, version)) changed = true;
    }
  }
  return changed;
}
module.exports = { patchCfg };

if (require.main === module) {
  const out = execSync('npx expo-modules-autolinking resolve --platform android --json', { encoding: 'utf8', maxBuffer: 1e8 });
  const { modules } = JSON.parse(out);
  for (const m of modules) {
    const bad = (m.projects || []).some((p) => p.publication && !p.publication.version);
    if (!bad) continue;
    let root;
    try { root = path.dirname(require.resolve(`${m.packageName}/package.json`, { paths: [process.cwd()] })); }
    catch { root = m.path; }
    const version = m.packageVersion || JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
    const cfgFile = path.join(root, 'expo-module.config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
    console.log(m.packageName, 'android config:', JSON.stringify(cfg.android).slice(0, 500));
    if (patchCfg(cfg, version)) { fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2)); console.log('patched', m.packageName, version); }
    else console.log('no publication block found in config for', m.packageName);
  }
}
