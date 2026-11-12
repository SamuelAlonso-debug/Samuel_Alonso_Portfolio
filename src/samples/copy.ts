/**
 * Sample copy until the owner delivers the final headline and statement.
 * Launch (#50) deletes src/samples/.
 */
import type { Locale } from '../i18n/config';

interface SampleCopy {
  headline: string;
  statement: string;
  about: { bio: string; facts: [term: string, detail: string][] };
}

export const sampleCopy: Record<Locale, SampleCopy> = {
  es: {
    headline: 'Sistemas para pymes que no pueden detenerse, con resultados que puedes revisar.',
    statement:
      'No te pido que confíes en mí. Te dejo leer el código, ver el sistema funcionando y hablar con quien ya trabajó conmigo.',
    about: {
      bio: 'Soy ingeniero de software. Me gusta entrar donde un sistema ya duele: entender el negocio, decidir con datos y dejar todo documentado para que no dependas de mí.',
      facts: [
        ['Base', 'Querétaro, México'],
        ['Idiomas', 'Español, inglés'],
        ['Fuerte en', 'Arquitectura, UX, incidentes'],
        ['Trabajo con', 'Pymes y equipos pequeños'],
      ],
    },
  },
  en: {
    headline: "Systems for small businesses that can't stop, with results you can check.",
    statement:
      "I don't ask you to trust me. I let you read the code, watch the system run and talk to the people who worked with me.",
    about: {
      bio: "I'm a software engineer. I like stepping in where a system already hurts: understand the business, decide with data and document everything so you don't depend on me.",
      facts: [
        ['Based in', 'Querétaro, Mexico'],
        ['Languages', 'Spanish, English'],
        ['Strong at', 'Architecture, UX, incidents'],
        ['Works with', 'Small businesses and teams'],
      ],
    },
  },
};
