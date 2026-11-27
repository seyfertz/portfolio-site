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
  landing: { price: 7000, days: [2, 3], scope: 'Адаптивная страница, витрина услуг и форма заявки', preview: 'Калькулятор выгоды и форма заявки' },
  booking: { price: 10000, days: [3, 4], scope: 'Сайт, каталог услуг, специалисты, календарь и запись', preview: 'Услуги, мастера и свободное время' },
  miniapp: { price: 10000, days: [3, 4], scope: 'Бот и приложение в Telegram с каталогом и записью', preview: 'Запись и бонусный баланс в Telegram' },
  full: { price: 18000, days: [5, 7], scope: 'Сайт, бот, общая база и кабинет с отчётами по выручке', preview: 'Выручка, график записей и отчёт по мастерам' },
};
const modules = {
  reminder: { price: 1500, label: 'Авто-напоминания за 2 часа' },
  loyalty: { price: 2500, label: 'Система лояльности и бонусов' },
  maps: { price: 2000, label: 'Интеграция с картами 2ГИС / Яндекс' },
  telegram: { price: 1500, label: 'Уведомления в Telegram' },
};
const number = new Intl.NumberFormat('ru-RU');
const plural = new Intl.PluralRules('ru');
const rubles = (value) => number.format(value) + ' ₽';
const calculator = $('#calculator');
const packageSelect = calculator.elements.solution;
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
  const solution = solutions[packageSelect.value];
  const selected = [...calculator.querySelectorAll('input[name="modules"]:checked')].map((input) => modules[input.value]);
  const price = selected.reduce((sum, item) => sum + item.price, solution.price);
  const earliest = solution.days[0] + selected.length * 0.5;
  const latest = solution.days[1] + selected.length;
  const range = number.format(earliest) + '–' + number.format(latest);
  const launch = range + ' ' + ({ one: 'день', few: 'дня', many: 'дней', other: 'дня' })[plural.select(latest)];
  const budget = 'от ' + rubles(price);
  $('#price').textContent = budget;
  $('#duration').textContent = launch + ' до запуска';
  brief = ['План запуска проекта · Контур', 'Ниша: ' + calculator.elements.niche.value, 'Пакет: ' + packageSelect.selectedOptions[0].textContent,
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

const preview = $('#package-preview');
const previewIllustrations = [...preview.querySelectorAll('[data-preview]')];
const packageDialog = $('#package-demo');
const packageDemoBody = $('#package-demo-body');
const demoServices = [
  { name: 'Стрижка', price: 1800 },
  { name: 'Окрашивание', price: 3600 },
  { name: 'Уход за волосами', price: 2200 },
];
const demoMasters = [
  { name: 'Анна', services: [0, 1] },
  { name: 'Марк', services: [0, 2] },
  { name: 'Лера', services: [1, 2] },
];
const demoDateFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });

function syncPackagePreview() {
  preview.dataset.package = packageSelect.value;
  $('#package-preview-name').textContent = packageSelect.selectedOptions[0].textContent;
  $('#package-preview-copy').textContent = solutions[packageSelect.value].preview;
  for (const illustration of previewIllustrations) {
    illustration.toggleAttribute('hidden', illustration.dataset.preview !== packageSelect.value);
  }
}

function mountSalesDemo(screen) {
  const slider = screen.querySelector('input[type="range"]');
  const count = screen.querySelector('[data-item-count]');
  const savings = screen.querySelector('[data-savings]');
  const request = screen.querySelector('[data-demo-request]');
  const form = screen.querySelector('form');
  const message = screen.querySelector('[data-demo-status]');
  function updateSavings() {
    count.value = slider.value;
    savings.textContent = rubles((slider.valueAsNumber - 1) * 900);
  }
  slider.addEventListener('input', updateSavings);
  updateSavings();
  request.addEventListener('click', () => {
    form.hidden = !form.hidden;
    request.setAttribute('aria-expanded', String(!form.hidden));
    message.textContent = '';
    if (!form.hidden) form.elements.name.focus();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    form.hidden = true;
    request.setAttribute('aria-expanded', 'false');
    request.focus();
    message.textContent = 'Демо-заявка принята. Данные никуда не отправлены.';
  });
}

function replaceOptions(select, entries) {
  select.replaceChildren(...entries.map(([value, label]) => new Option(label, value)));
}

function mountChoiceButtons(select) {
  const label = select.closest('label');
  const group = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = label.firstChild.textContent;
  const buttons = [...select.options].map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.text;
    button.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return button;
  });
  function syncPressed() {
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === select.selectedIndex)));
  }
  group.className = 'demo-pick';
  group.append(legend, ...buttons);
  label.hidden = true;
  label.after(group);
  select.addEventListener('change', syncPressed);
  syncPressed();
}

function mountBookingDemo(form, phone) {
  const { service, master, date, slot } = form.elements;
  const message = form.querySelector('[role="status"]');
  const submit = form.querySelector('[type="submit"]');
  const reservations = new Set();
  const today = new Date();
  const dates = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() + index + 1);
    return day;
  });
  replaceOptions(service, demoServices.map((item, index) => [index, item.name + ' · ' + rubles(item.price)]));
  replaceOptions(date, dates.map((day, index) => [index, demoDateFormat.format(day)]));

  if (phone) {
    mountChoiceButtons(service);
    mountChoiceButtons(date);
  }

  function updateMasters() {
    const previous = master.value;
    const options = demoMasters.flatMap((item, index) => item.services.includes(Number(service.value)) ? [[index, item.name]] : []);
    replaceOptions(master, options);
    if (options.some(([id]) => String(id) === previous)) master.value = previous;
  }

  const reservationKey = (time) => [master.value, date.value, time].join('/');
  function updateSlots() {
    const offset = (Number(master.value) + dates[Number(date.value)].getDate() + Number(service.value)) % 4;
    const available = ['10:00', '11:30', '14:00', '16:30'].filter((time, index) => index !== offset && !reservations.has(reservationKey(time)));
    replaceOptions(slot, available.length ? available.map((time) => [time, time]) : [['', 'Нет свободного времени']]);
    slot.disabled = submit.disabled = !available.length;
  }

  form.addEventListener('change', (event) => {
    if (event.target === service) updateMasters();
    if (event.target !== slot) updateSlots();
    message.textContent = '';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!slot.value) return;
    reservations.add(reservationKey(slot.value));
    message.textContent = `Демо-запись подтверждена. ${demoServices[service.value].name}, ${date.selectedOptions[0].text} в ${slot.value}. Мастер — ${demoMasters[master.value].name}.`;
    updateSlots();
  });
  updateMasters();
  updateSlots();
}

function mountDashboardDemo(screen) {
  const periods = {
    week: { labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], counts: [7, 8, 5, 9, 11, 12, 5], masters: [[24, 30100], [18, 25500], [15, 22000]] },
    month: { labels: ['1–7', '8–14', '15–21', '22–31'], counts: [57, 62, 55, 64], masters: [[96, 126400], [81, 105300], [61, 84200]] },
  };
  const period = screen.querySelector('select');
  const chart = screen.querySelector('.demo-chart');
  const table = screen.querySelector('tbody');
  screen.querySelector('[data-revenue="day"]').textContent = rubles(12400);
  screen.querySelector('[data-revenue="month"]').textContent = rubles(periods.month.masters.reduce((total, [, revenue]) => total + revenue, 0));

  function render() {
    const { labels, counts, masters } = periods[period.value];
    chart.replaceChildren(...counts.map((count, index) => {
      const item = document.createElement('li');
      const bar = document.createElement('span');
      const label = document.createElement('small');
      bar.style.setProperty('--bar-height', 100 * count / Math.max(...counts) + '%');
      bar.textContent = count;
      label.textContent = labels[index];
      item.append(bar, label);
      return item;
    }));
    table.replaceChildren();
    masters.forEach(([count, revenue], index) => {
      const row = table.insertRow();
      [demoMasters[index].name, count, rubles(revenue)].forEach((value) => { row.insertCell().textContent = value; });
    });
  }

  period.addEventListener('change', render);
  render();
}

packageSelect.addEventListener('input', syncPackagePreview);
syncPackagePreview();
$('#open-package-demo').addEventListener('click', () => {
  const selected = packageSelect.value;
  $('#package-demo-title').textContent = packageSelect.selectedOptions[0].textContent;
  packageDemoBody.replaceChildren($('#demo-' + selected).content.cloneNode(true));
  if (selected === 'landing') mountSalesDemo(packageDemoBody);
  if (selected === 'booking') mountBookingDemo(packageDemoBody.querySelector('form'), false);
  if (selected === 'miniapp') {
    const phone = packageDemoBody.querySelector('.demo-phone-body');
    phone.append($('#demo-booking').content.cloneNode(true));
    mountBookingDemo(phone.querySelector('form'), true);
  }
  if (selected === 'full') mountDashboardDemo(packageDemoBody);
  packageDialog.showModal();
  packageDialog.scrollTop = 0;
});

function clickedBackdrop(event) {
  const { left, right, top, bottom } = packageDialog.getBoundingClientRect();
  return event.target === packageDialog && (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom);
}

let backdropPress = false;
packageDialog.addEventListener('pointerdown', (event) => { backdropPress = clickedBackdrop(event); });
packageDialog.addEventListener('click', (event) => {
  if (backdropPress && clickedBackdrop(event)) packageDialog.close();
  backdropPress = false;
});

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
