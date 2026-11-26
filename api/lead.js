// Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в Vercel → Settings → Environment Variables.
import { DEMO_PROFILE } from '../lead-demo.js';

const windows = new Map();
const consentVersion = process.env.LEAD_CONSENT_VERSION || '2026-11-26';

function rateLimited(address) {
  const now = Date.now();
  for (const [key, entry] of windows) if (entry.until < now) windows.delete(key);
  const entry = windows.get(address) || { count: 0, until: now + 60000 };
  entry.count++;
  if (windows.size < 2000 || windows.has(address)) windows.set(address, entry);
  return entry.count > 5;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Отправьте заявку через форму.' });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || process.env.LEAD_BOT_TOKEN?.trim();
  const chat = process.env.TELEGRAM_CHAT_ID?.trim() || process.env.LEAD_CHAT_ID?.trim();
  if (!token || !chat) return response.status(503).json({ code: 'not_configured' });
  if (request.headers.origin) {
    try {
      if (new URL(request.headers.origin).host !== request.headers.host) return response.status(403).json({ error: 'Неверный источник заявки.' });
    } catch {
      return response.status(403).json({ error: 'Неверный источник заявки.' });
    }
  }
  if (!request.headers['content-type']?.startsWith('application/json')) return response.status(415).json({ error: 'Ожидается JSON.' });
  const address = String(request.headers['x-vercel-forwarded-for'] || request.socket?.remoteAddress || '').split(',')[0].trim();
  if (rateLimited(address)) return response.status(429).json({ error: 'Слишком много заявок. Повторите через минуту.' });
  let input;
  try {
    input = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch {
    return response.status(400).json({ error: 'Проверьте поля формы.' });
  }
  if (!input || typeof input !== 'object' || input.consent !== true || input.consentVersion !== consentVersion) {
    return response.status(400).json({ error: 'Необходимо согласие на обработку данных.' });
  }
  if (input.website) return response.status(400).json({ error: 'Проверьте поля формы.' });
  const clean = (value, max) => typeof value === 'string' && value.length <= max ? value.trim() : '';
  const sample = DEMO_PROFILE.enabled ? DEMO_PROFILE.sample : null;
  const name = sample?.name ?? clean(input.name, 80);
  const contact = sample?.contact ?? clean(input.contact, 100);
  if (!name || !contact) return response.status(400).json({ error: 'Укажите имя и контакт.' });
  const text = [sample ? 'Пример заявки · Контур' : 'Новая заявка · Контур', 'Имя: ' + name, 'Контакт: ' + contact,
    'Согласие: ' + consentVersion + ' · ' + new Date().toISOString(),
    sample?.message ?? clean(input.message, 700), clean(input.brief, 1800)].filter(Boolean).join('\n\n');
  try {
    const result = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(8500),
    });
    if (result.ok && (await result.json()).ok) return response.status(200).json({ ok: true });
  } catch {
    // Keep the token and form contents out of deployment logs.
  }
  return response.status(502).json({ error: 'Telegram временно недоступен. Повторите отправку позже.' });
}
