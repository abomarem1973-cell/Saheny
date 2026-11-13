// أدوات مساعدة: الوقت والعد التنازلي ومولّد الألغاز

// أيام الأسبوع بترتيب JavaScript (0 = الأحد)
export const DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

// تحويل الساعة إلى نظام 12 ساعة مع ص/م
export function formatTime(h, m) {
  const period = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period };
}

// أقرب موعد رنين للمنبه (days فارغة = مرة واحدة)
export function getNextTrigger(alarm, now = new Date()) {
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(alarm.hour, alarm.minute, 0, 0);
    if (d > now && (alarm.days.length === 0 || alarm.days.includes(d.getDay()))) return d;
  }
  return null;
}

// نص العد التنازلي: "بعد 7 ساعات و 25 دقيقة"
export function countdownText(target, now = new Date()) {
  const mins = Math.max(1, Math.round((target - now) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  const hw = h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : h <= 10 ? `${h} ساعات` : `${h} ساعة`;
  const mw = m === 1 ? 'دقيقة' : m === 2 ? 'دقيقتان' : m <= 10 ? `${m} دقائق` : `${m} دقيقة`;
  if (h === 0) return `بعد ${mw}`;
  return m === 0 ? `بعد ${hw}` : `بعد ${hw} و ${mw}`;
}

// مولّد لغز رياضي بسيط: a × b + c
export function makePuzzle() {
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const a = rnd(6, 19), b = rnd(3, 9), c = rnd(5, 40);
  // \u202A ... \u202C تثبّت اتجاه المعادلة من اليسار لليمين داخل نص عربي
  return { question: `\u202A${a} × ${b} + ${c}\u202C`, answer: a * b + c };
}

// تحويل الأرقام العربية (٠-٩) والفارسية (۰-۹) إلى لاتينية، وحذف أي رمز غير رقمي
export const toLatinDigits = (t) =>
  t.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
   .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
   .replace(/\D/g, '');
