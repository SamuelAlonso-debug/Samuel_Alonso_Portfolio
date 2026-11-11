/**
 * Sample copy until the owner delivers the final headline and statement.
 * Launch (#50) deletes src/samples/.
 */
import type { Locale } from '../i18n/config';

export const sampleCopy: Record<Locale, { headline: string; statement: string }> = {
  es: {
    headline: 'Sistemas para pymes que no pueden detenerse, con resultados que puedes revisar.',
    statement:
      'No te pido que confíes en mí. Te dejo leer el código, ver el sistema funcionando y hablar con quien ya trabajó conmigo.',
  },
  en: {
    headline: "Systems for small businesses that can't stop, with results you can check.",
    statement:
      "I don't ask you to trust me. I let you read the code, watch the system run and talk to the people who worked with me.",
  },
};
