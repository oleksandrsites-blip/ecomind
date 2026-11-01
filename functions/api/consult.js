// Cloudflare Pages Function: заявка з форми «Записатися на розбір» → Telegram Валентини.
// Змінні середовища (Cloudflare → проєкт → Settings → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN — токен бота від @BotFather (тип Secret)
//   TELEGRAM_CHAT_ID   — id чату Валентини з ботом

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// Телефон → посилання для дзвінка, @username → посилання на чат
const contactLink = (raw = '') => {
  const value = raw.trim();
  const username = value.match(/^@?([a-zA-Z][a-zA-Z0-9_]{4,31})$/);
  if (username && value.startsWith('@')) return `<a href="https://t.me/${username[1]}">${escapeHtml(value)}</a>`;
  const digits = value.replace(/[^\d+]/g, '');
  if (digits.replace('+', '').length >= 9) {
    const phone = digits.startsWith('+') ? digits : digits.startsWith('380') ? `+${digits}` : digits.startsWith('0') ? `+38${digits}` : digits;
    return `<a href="tel:${phone}">${escapeHtml(value)}</a>`;
  }
  return escapeHtml(value);
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = env;
  if (!token || !chatId) return json({ ok: false, error: 'not-configured' }, 500);

  let data;
  try {
    data = Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }

  // Пастка для ботів: людина це поле не бачить
  if ((data['bot-field'] || '').trim()) return json({ ok: true });

  const name = (data.name || '').trim().slice(0, 200);
  const contact = (data.contact || '').trim().slice(0, 200);
  const team = (data.team || '').trim().slice(0, 200);
  if (!name || !contact) return json({ ok: false, error: 'invalid' }, 422);

  const time = new Date().toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const text = [
    '🟢 <b>Нова заявка на стратегічний розбір</b>',
    '',
    `<b>Ім’я:</b> ${escapeHtml(name)}`,
    `<b>Контакт:</b> ${contactLink(contact)}`,
    `<b>Розмір команди:</b> ${escapeHtml(team)}`,
    '',
    `<i>${time} · з сайту</i>`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) {
    console.error('Telegram error', res.status, await res.text());
    return json({ ok: false, error: 'telegram' }, 502);
  }
  return json({ ok: true });
}
