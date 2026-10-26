// Netlify запускає цю функцію автоматично для кожної заявки з форми (після фільтра спаму)
// і пересилає її Валентині в Telegram від імені бота.
//
// Потрібні змінні середовища в Netlify (Site configuration → Environment variables):
//   TELEGRAM_BOT_TOKEN — токен бота від @BotFather
//   TELEGRAM_CHAT_ID   — id чату Валентини з ботом (див. CLAUDE.md / інструкцію)

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

exports.handler = async (event) => {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = process.env;
  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN або TELEGRAM_CHAT_ID не задані');
    return { statusCode: 200, body: 'telegram not configured' };
  }

  const { payload } = JSON.parse(event.body || '{}');
  if (!payload || payload.form_name !== 'consult') return { statusCode: 200, body: 'skip' };

  const data = payload.data || {};
  const time = new Date(payload.created_at || Date.now()).toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const text = [
    '🟢 <b>Нова заявка на стратегічний розбір</b>',
    '',
    `<b>Ім’я:</b> ${escapeHtml(data.name)}`,
    `<b>Контакт:</b> ${contactLink(data.contact)}`,
    `<b>Розмір команди:</b> ${escapeHtml(data.team)}`,
    '',
    `<i>${time} · з сайту</i>`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });

  if (!res.ok) console.error('Telegram error', res.status, await res.text());
  return { statusCode: 200, body: 'ok' };
};
