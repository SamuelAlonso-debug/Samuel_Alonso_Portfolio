import type { Locale } from './config';

const es = {
  'meta.siteName': 'Samuel Alonso',
  'meta.home.title': 'Samuel Alonso · Ingeniero de software',
  'meta.home.description':
    'Ingeniero de software en Querétaro, México. Arquitectura, UX, entrega y operación de software. Sitio en construcción.',
  'a11y.skip': 'Saltar al contenido',
  'header.home': 'Samuel Alonso, inicio',
  'lang.switch': 'English',
  'lang.switchLabel': 'Read this page in English',
  'theme.button': 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'home.role': 'Ingeniero de software',
  'home.lede':
    'Este sitio está en construcción. Reunirá casos respaldados por evidencia verificable: demos, repositorios, testimonios con nombre y artefactos de proceso.',
  'home.elsewhere': 'Mientras tanto',
  'footer.rights': 'Todos los derechos reservados sobre el contenido.',
  'footer.build': 'Versión',
  'notFound.title': 'Página no encontrada',
  'notFound.body': 'La dirección no existe o cambió de lugar.',
  'notFound.back': 'Volver al inicio',
} as const;

type UIKey = keyof typeof es;

// The type annotation forces EN to have exactly the ES keys.
const en: Record<UIKey, string> = {
  'meta.siteName': 'Samuel Alonso',
  'meta.home.title': 'Samuel Alonso · Software engineer',
  'meta.home.description':
    'Software engineer based in Querétaro, Mexico. Architecture, UX, delivery and operations. Site under construction.',
  'a11y.skip': 'Skip to content',
  'header.home': 'Samuel Alonso, home',
  'lang.switch': 'Español',
  'lang.switchLabel': 'Leer esta página en español',
  'theme.button': 'Theme',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'home.role': 'Software engineer',
  'home.lede':
    'This site is under construction. It will gather case studies backed by verifiable evidence: demos, repositories, named testimonials and process artifacts.',
  'home.elsewhere': 'Meanwhile',
  'footer.rights': 'All rights reserved on the content.',
  'footer.build': 'Build',
  'notFound.title': 'Page not found',
  'notFound.body': 'This address does not exist or has moved.',
  'notFound.back': 'Back to home',
};

export const ui = { es, en } satisfies Record<Locale, Record<UIKey, string>>;

export type { UIKey };

export function t(locale: Locale, key: UIKey): string {
  return ui[locale][key];
}
