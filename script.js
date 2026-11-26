// Настройки витрины. Поля оператора показываются в политике и согласии.
// TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID — серверные переменные Vercel для api/lead.js.
// Публичный JS содержит только адрес формы и сведения об операторе.
const CONFIG = Object.freeze({
  leadEndpoint: '/api/lead',
  operator: 'Контур Studio',
  operatorStatus: 'самозанятый веб-разработчик',
  privacyContact: '@freshxw',
  consentVersion: '2026-11-26',
});

import { mountDemos } from './demos.js';
import { DEMO_PROFILE } from './lead-demo.js';
import './terrain.js';

const $ = (selector) => document.querySelector(selector);
const solutions = {
  landing: { price: 7000, days: [1, 1], scope: 'Адаптивная страница, витрина услуг и форма заявки' },
  booking: { price: 10000, days: [1, 2], scope: 'Сайт, каталог услуг, специалисты, календарь и запись' },
  miniapp: { price: 10000, days: [1, 2], scope: 'Чат-бот, Mini App, каталог и запись в Telegram' },
  full: { price: 18000, days: [2, 3], scope: 'Сайт, Mini App, чат-бот, общая база и кабинет владельца' },
};
const modules = {
  reminder: { price: 1500, days: 0, label: 'Авто-напоминания за 2 часа' },
  loyalty: { price: 2500, days: 0.5, label: 'Система лояльности и бонусов' },
  maps: { price: 2000, days: 0.5, label: 'Интеграция с картами 2ГИС / Яндекс' },
  telegram: { price: 1500, days: 0, label: 'Уведомления в Telegram' },
};
const number = new Intl.NumberFormat('ru-RU');
const plural = new Intl.PluralRules('ru');
const rubles = (value) => number.format(value) + ' ₽';
const calculator = $('#calculator');
const leadForm = $('#lead-form');
const consent = leadForm.elements.consent;
const send = $('#send');
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const hostedDemo = DEMO_PROFILE.enabled && !isLocal;
const live = !isLocal && (DEMO_PROFILE.enabled || Boolean(CONFIG.operator && CONFIG.privacyContact));
let brief = '';

function status(element, text, failure = false) {
  element.textContent = text;
  element.hidden = !text;
  element.classList.toggle('error', failure);
}

function estimate() {
  const solution = solutions[calculator.elements.solution.value];
  const selected = [...calculator.querySelectorAll('input:checked')].map((input) => modules[input.value]);
  const price = selected.reduce((sum, item) => sum + item.price, solution.price);
  const extraDays = selected.reduce((sum, item) => sum + item.days, 0);
  const [earliest, latest] = solution.days.map((day) => day + extraDays);
  const range = earliest === latest ? number.format(latest) : number.format(earliest) + '–' + number.format(latest);
  const launch = range + ' ' + ({ one: 'день', few: 'дня', many: 'дней', other: 'дня' })[plural.select(latest)];
  const budget = 'от ' + rubles(price);
  $('#price').textContent = budget;
  $('#duration').textContent = launch + ' до запуска';
  brief = ['План запуска проекта · Контур', 'Ниша: ' + calculator.elements.niche.value, 'Решение: ' + calculator.elements.solution.selectedOptions[0].textContent,
    'Состав: ' + solution.scope, 'Модули: ' + (selected.map((item) => item.label).join(', ') || 'без дополнительных модулей'),
    'Расчёт стоимости: ' + budget, 'Срок запуска: ' + launch].join('\n');
  $('#brief').textContent = brief;
  status($('#copy-status'), '');
}
calculator.addEventListener('input', estimate);
estimate();

$('#copy').onclick = async () => {
  try {
    if (!navigator.clipboard) throw Error();
    await navigator.clipboard.writeText(brief);
    status($('#copy-status'), 'План запуска скопирован.');
  } catch {
    const block = $('#brief');
    block.closest('details').open = true;
    const range = document.createRange();
    range.selectNodeContents(block);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const copied = document.execCommand('copy');
    if (copied) selection.removeAllRanges();
    status($('#copy-status'), copied ? 'План запуска скопирован.' : 'Текст выделен. Его можно скопировать вручную.');
  }
};
$('#attach').onclick = () => { $('#include-brief').checked = true; };

const legal = $('#legal');
const documents = DEMO_PROFILE.enabled ? {
  privacy: {
    title: 'Политика конфиденциальности',
    paragraphs: [
      'Контур — сайт самозанятого веб-разработчика. По вопросам о работе сайта и обработке данных напишите в Telegram: ' + DEMO_PROFILE.contact + '.',
      hostedDemo
        ? 'Форма использует готовый пример заявки. Vercel передаёт пример в Telegram и прикладывает расчёт стоимости, если вы его выбрали.'
        : 'При просмотре сайта на вашем устройстве форма сохраняет пример заявки в этом браузере. Используйте вымышленные данные.',
      'Версия согласия ' + CONFIG.consentVersion + '.',
    ],
  },
  consent: {
    title: 'Согласие на отправку примера заявки',
    paragraphs: [
      hostedDemo ? 'Я подтверждаю отправку примера заявки и выбранного расчёта в Telegram.'
        : 'Я согласен(на) сохранить пример заявки в этом браузере.',
      'Версия согласия ' + CONFIG.consentVersion + '.',
    ],
  },
} : {
  privacy: {
    title: 'Политика конфиденциальности',
    paragraphs: [
      live ? 'Оператор — ' + CONFIG.operator + ', ' + CONFIG.operatorStatus + '. Контакт по вопросам персональных данных — ' + CONFIG.privacyContact + '.'
        : 'При локальном просмотре форма хранит заявки в этом браузере.',
      'Для ответа на заявку нужны имя, контакт и сведения о проекте. Вы можете приложить план запуска.',
      ...(live ? [
        'Заявка отправляется через серверную функцию Vercel в личный чат оператора в Telegram. В сообщение включаются версия согласия и время его получения.',
        'Данные обрабатываются до рассмотрения заявки или отзыва согласия, если у оператора нет иных законных оснований для обработки. Чтобы отозвать согласие или уточнить порядок обработки, напишите по контакту оператора.',
      ] : [
        'Локальные черновики остаются в этом браузере. Витрина очищает записи старше 30 дней при открытии. Черновики также можно удалить через настройки данных сайта.',
      ]),
    ],
  },
  consent: {
    title: 'Согласие на обработку персональных данных',
    paragraphs: [
      live ? 'Я даю оператору ' + CONFIG.operator + ' согласие на обработку моих персональных данных для рассмотрения заявки и связи со мной.'
        : 'Я согласен(на) сохранить введённые данные в этом браузере для проверки формы. Сервис обработки заявок ещё не подключён.',
      'Согласие распространяется на имя, телефон или имя пользователя в Telegram и предоставленный мной текст о проекте.',
      'При включённой отправке оператор получает и использует эти данные для подготовки ответа на заявку. Отозвать согласие можно через контакт, указанный в политике конфиденциальности.',
      'Версия согласия ' + CONFIG.consentVersion + '.',
    ],
  },
};
document.querySelectorAll('[data-legal]').forEach((button) => {
  button.onclick = () => {
    const documentText = documents[button.dataset.legal];
    $('#legal-title').textContent = documentText.title;
    $('#legal-content').replaceChildren(...documentText.paragraphs.map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    legal.showModal();
  };
});
consent.addEventListener('change', () => { send.disabled = !consent.checked; });
if (DEMO_PROFILE.enabled) {
  $('.consent label span').textContent = hostedDemo
    ? 'Согласен отправить пример заявки в Telegram'
    : 'Согласен сохранить пример заявки в этом браузере';
}
if (hostedDemo) {
  for (const [field, value] of Object.entries(DEMO_PROFILE.sample)) {
    const input = leadForm.elements[field];
    input.defaultValue = input.value = value;
    input.readOnly = true;
    input.removeAttribute('autocomplete');
  }
  send.textContent = 'Отправить пример заявки';
}
if (!live) {
  send.textContent = 'Сохранить локально';
  status($('#lead-status'), 'Пример заявки сохранится в этом браузере.');
}

function saveLocal(lead) {
  const key = 'kontur-local-leads';
  const before = JSON.parse(localStorage.getItem(key) || '[]');
  const cutoff = Date.now() - 30 * 86400000;
  const recent = before.filter((item) => Date.parse(item.created) >= cutoff).slice(-24);
  localStorage.setItem(key, JSON.stringify([...recent, { ...lead, created: new Date().toISOString() }]));
}
try {
  const key = 'kontur-local-leads';
  if (localStorage.getItem(key)) {
    const existing = JSON.parse(localStorage.getItem(key)).filter((item) => Date.now() - Date.parse(item.created) <= 30 * 86400000);
    localStorage.setItem(key, JSON.stringify(existing));
  }
} catch {
  // Privacy modes can disable local storage.
}

leadForm.onsubmit = async (event) => {
  event.preventDefault();
  if (!consent.checked || send.disabled) return;
  const values = new FormData(leadForm);
  const lead = {
    name: String(values.get('name')).trim(),
    contact: String(values.get('contact')).trim(),
    message: String(values.get('message')).trim(),
    website: String(values.get('website')).trim(),
    brief: $('#include-brief').checked ? brief : '',
    consent: true,
    consentVersion: CONFIG.consentVersion,
  };
  if (!lead.name || !lead.contact) {
    status($('#lead-status'), 'Укажите имя и контакт.', true);
    return;
  }
  send.disabled = true;
  status($('#lead-status'), 'Сохраняем заявку…');
  try {
    if (live) {
      const response = await fetch(CONFIG.leadEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw Error(result.error || 'Сервис заявок недоступен. Повторите позже.');
    }
    if (!live) saveLocal(lead);
    leadForm.reset();
    status($('#lead-status'), !live ? 'Заявка сохранена локально. Для отправки подключите Telegram.'
      : hostedDemo ? 'Пример заявки отправлен в Telegram.' : 'Заявка отправлена. Мы свяжемся с вами.');
  } catch (error) {
    status($('#lead-status'), error.message || 'Не удалось сохранить заявку. Проверьте настройки браузера.', true);
  } finally {
    send.disabled = !consent.checked;
  }
};

mountDemos();
const motion = matchMedia('(prefers-reduced-motion: reduce)');
if (!motion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
}
document.querySelectorAll('.spotlight').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const { left, top } = card.getBoundingClientRect();
    card.style.setProperty('--x', (event.clientX - left) + 'px');
    card.style.setProperty('--y', (event.clientY - top) + 'px');
  }, { passive: true });
});
