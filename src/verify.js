// التحقق من الصورة بنموذج Claude للرؤية.
// ⚠️ المفتاح داخل التطبيق للتجربة فقط. في النسخة النهائية مرّر الطلب عبر خادمك الخاص.
// ضع المفتاح في ملف .env:  EXPO_PUBLIC_ANTHROPIC_KEY=sk-ant-...
const KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export async function verifyPhoto(base64, target) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-5-5',
      max_tokens: 5,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: `Does this photo clearly show this object: "${target}"? Answer only YES or NO.` },
        ],
      }],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'API error');
  return /YES/i.test(json.content?.[0]?.text || '');
}
