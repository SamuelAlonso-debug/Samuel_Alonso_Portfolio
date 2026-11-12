/**
 * Sample copy until the owner delivers the final headline and statement.
 * Launch (#50) deletes src/samples/.
 */
import type { Locale } from '../i18n/config';

interface SampleCopy {
  headline: string;
  statement: string;
  about: { bio: string; facts: [term: string, detail: string][] };
  howIWork: [title: string, detail: string, duration: string][];
  contact: string;
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
    howIWork: [
      [
        'Revisión de arquitectura',
        'Un documento con el estado de tu sistema, los riesgos en orden y un plan de 90 días.',
        '1 a 2 semanas',
      ],
      [
        'Proyecto de punta a punta',
        'Requisitos, diseño, construcción y puesta en producción, con despliegues verificados.',
        '1 a 4 meses',
      ],
      [
        'Soporte mensual',
        'Mantenimiento, monitoreo y respuesta a incidentes en horario de Querétaro.',
        'Mes a mes',
      ],
    ],
    contact: 'Una llamada de 30 minutos para entender qué necesitas y decirte si puedo ayudarte.',
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
    howIWork: [
      [
        'Architecture review',
        "A document with your system's state, risks in order and a 90-day plan.",
        '1 to 2 weeks',
      ],
      [
        'End-to-end project',
        'Requirements, design, build and launch, with verified deploys.',
        '1 to 4 months',
      ],
      [
        'Monthly support',
        'Maintenance, monitoring and incident response on Querétaro hours.',
        'Month to month',
      ],
    ],
    contact: 'A 30-minute call to understand what you need and tell you whether I can help.',
  },
};
