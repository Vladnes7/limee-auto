// Company facts. Every value comes from the parsed site (_материалы/общая-информация.md, реквизиты)
// or from Vladislav's decisions on the contradictions (SPEC.md).
export const company = {
  brand: 'Limee Auto',
  legal: 'ООО «ФОМАТИК»',
  ogrn: '1197746509322',
  inn: '9717085357',
  kpp: '770901001',
  account: '40702810610960001315',
  bank: 'Филиал «Центральный» Банка ВТБ (ПАО)',
  bik: '044525411',
  corr: '30101810145250000411',
  phone: '+7 (909) 986-88-88',
  phoneHref: 'tel:+79099868888',
  hours: 'Ежедневно 9:00–21:00',
  email: 'info@autolimee.ru',
  emailNote: 'Отвечаем в течение рабочего дня',
  city: 'г. Москва',
  address: '105064, город Москва, Нижний Сусальный пер., д. 5, стр. 19',
  slogan: 'Премиальные автомобили под заказ из Китая и Кореи',
  about: 'Работаем прозрачно и по договору. Подберём, доставим и растаможим автомобиль под ключ.',
  site: 'https://autolimee.ru',
};

// wa.me needs the number in international format; the old site linked wa.me/8966... which WhatsApp rejects.
export const whatsappNumber = '79661569498';

export const socials = [
  { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${whatsappNumber}` },
  { id: 'telegram', label: 'Telegram', href: 'https://t.me/limeeauto' },
  { id: 'rutube', label: 'Rutube', href: 'https://rutube.ru/channel/72278734/' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/limeeauto/' },
  { id: 'vk', label: 'ВКонтакте', href: 'https://vk.ru/limee_auto' },
  { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@limeeauto' },
];

export const links = {
  vitrina: 'https://avtochina247.ru/c/partnerelits',
  tazzz: 'https://tazzz.ru/',
};

export const nav = [
  { href: '/catalog/', label: 'Каталог' },
  { href: links.vitrina, label: 'Витрина', external: true },
  { href: '/about/', label: 'О компании' },
  { href: '/contacts/', label: 'Контакты' },
];

export const legalNav = [
  { href: '/privacy/', label: 'Политика конфиденциальности' },
  { href: '/terms/', label: 'Пользовательское соглашение' },
  { href: '/consent/', label: 'Согласие на обработку персональных данных' },
];

// Lead form, as on the old site (popup «Получить подборку автомобиля»).
export const leadForm = {
  title: 'Получить подборку автомобиля',
  text: 'Оставьте контакты, менеджер уточнит бюджет, желаемую модель и подготовит варианты новых авто из Китая.',
  contactMethods: ['WhatsApp', 'Max', 'Telegram', 'Телефон'],
  submit: 'Оставить заявку',
};

export const fallbackRate = { cny: 12.0557, date: '25.10.2026' };
