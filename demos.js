const data = {
  auto: { brand: 'ПИТ-СТОП / АВТОСЕРВИС', title: 'Время заняться машиной.', text: 'Диагностика, обслуживание и детейлинг. Выберите работу и время приёмки.', cta: 'Записаться в сервис', caption: 'Запись на обслуживание автомобиля', services: [['Диагностика', 1800], ['Замена масла', 2200], ['Детейлинг-мойка', 4200]] },
  barber: { brand: 'БРУТ / БАРБЕРШОП', title: 'Стрижка, которая вам к лицу.', text: 'Подберите услугу и найдите свободное окно у барбера.', cta: 'Выбрать стрижку', caption: 'Витрина услуг и запись к барберу', services: [['Мужская стрижка', 1500], ['Стрижка и борода', 2300], ['Моделирование бороды', 1000]] },
  dental: { brand: 'БЛИК / СТОМАТОЛОГИЯ', title: 'Больше поводов улыбаться.', text: 'Начните с осмотра, консультации или профессиональной гигиены.', cta: 'Выбрать приём', caption: 'Выбор стоматологической услуги и времени', services: [['Первичный осмотр', 1700], ['Консультация ортодонта', 2300], ['Гигиена', 5200]] },
  coffee: { brand: 'ЗЁРНА / КОФЕЙНЯ', title: 'Ваш кофе уже в планах.', text: 'Закажите кофе и выпечку к нужному времени.', cta: 'Сделать предзаказ', caption: 'Меню кофейни и предзаказ', services: [['Фильтр и круассан', 490], ['Два латте и десерт', 890], ['Кофе-бокс', 2300]] },
};

export function mountDemos() {
  const demo = document.querySelector('#demo');
  const device = document.querySelector('#device');
  const rubles = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  let current = 'auto';
  let selected;
  let time;
  let view = 'cover';

  const make = (tag, text, css) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (css) element.className = css;
    return element;
  };
  const button = (label, action, css = 'demo-button') => {
    const item = make('button', label, css);
    item.type = 'button';
    item.onclick = action;
    return item;
  };
  const go = (target) => { view = target; render(true); };

  function render(focus = false) {
    const item = data[current];
    demo.dataset.theme = current;
    document.querySelector('#case-address').textContent = 'demo.kontur / ' + current;
    document.querySelector('#case-caption').textContent = item.caption;
    const screen = make('div', '', 'demo-view ' + (view === 'cover' ? 'demo-cover' : 'demo-steps'));
    const title = make('h3');
    title.tabIndex = -1;
    if (view === 'cover') {
      title.textContent = item.title;
      screen.append(make('span', item.brand, 'demo-brand'), title, make('p', item.text), button(item.cta, () => go('services')));
    } else if (view === 'services') {
      title.textContent = 'Выберите услугу';
      const grid = make('div', '', 'demo-choices');
      grid.append(...item.services.map((service) => button(service[0] + ' · ' + rubles(service[1]),
        () => { selected = service; go('slots'); }, '')));
      screen.append(title, grid, button('На главную демо', () => go('cover'), 'demo-ghost'));
    } else if (view === 'slots') {
      title.textContent = 'Выберите время';
      const slots = make('div', '', 'demo-slots');
      slots.append(...['10:30', '12:00', '15:30'].map((slot) => button(slot, () => {
        time = slot;
        go('check');
      })));
      screen.append(title, make('p', selected[0] + ' · Завтра'), slots, button('К услугам', () => go('services'), 'demo-ghost'));
    } else if (view === 'check') {
      title.textContent = 'Проверьте запись';
      screen.append(title, make('p', selected[0] + ' · Завтра в ' + time + ' · ' + rubles(selected[1])),
        button('Подтвердить в демо', () => go('finish')), button('Выбрать другое время', () => go('slots'), 'demo-ghost'));
    } else {
      title.textContent = 'Демо-запись готова';
      screen.append(title, make('p', selected[0] + ' · Завтра в ' + time),
        make('p', 'Так выглядит подтверждение для клиента. Запись учебная.'),
        button('Попробовать ещё раз', () => go('cover')));
    }
    demo.replaceChildren(screen);
    demo.scrollTop = 0;
    if (focus) title.focus({ preventScroll: true });
  }

  const caseButtons = [...document.querySelectorAll('[data-case]')];
  caseButtons.forEach((control) => {
    control.onclick = () => {
      caseButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === control)));
      current = control.dataset.case;
      view = 'cover';
      render();
    };
  });
  const devices = [...document.querySelectorAll('[data-device]')];
  devices.forEach((control) => {
    control.onclick = () => {
      devices.forEach((item) => item.setAttribute('aria-pressed', String(item === control)));
      device.classList.toggle('phone', control.dataset.device === 'phone');
    };
  });
  render();
}
