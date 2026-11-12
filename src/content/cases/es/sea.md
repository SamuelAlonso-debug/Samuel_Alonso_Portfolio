---
title: Un sistema administrativo que una tienda opera sin soporte diario
summary: 'Caso de demostración: el cierre de mes pasó de dos días a una tarde con inventario, ventas y gastos en un solo sistema.'
translationKey: demo-sea
role: Ingeniero de software, de punta a punta
period: { start: 2024-01-01, end: 2024-09-30 }
competencies: [architecture, ux]
stack: [Astro, TypeScript, SQLite]
cover: ../covers/sea.svg
confidentiality: anonymized
anonymizationNote: Datos de demostración. El cliente, las cifras y los enlaces son ilustrativos.
evidence:
  - { kind: repo, label: Código, url: 'https://example.com/demo/sea' }
  - { kind: video, label: Video, url: 'https://example.com/demo/sea-video' }
  - {
      kind: metric,
      label: Cierre en 4 h,
      method: 'Bitácora de cierres de mes, antes y después (demostración).',
    }
lessons: Habría medido el tiempo de cierre desde la primera semana, no al final; la línea base salió de memoria.
---

## Contexto

Una tienda de abarrotes llevaba inventario, ventas y gastos en tres hojas de cálculo. Cada cierre de mes tomaba dos días.

## Restricciones

Una sola persona operaría el sistema, sin soporte técnico diario y con internet inestable.

## Opciones y decisión

Comparé un ERP comercial con un sistema a medida pequeño. Elegí el segundo: el ERP pedía capacitación y licencias que la tienda no podía sostener.

## Arquitectura

Antes: tres hojas sin relación. Después: una base SQLite local con respaldo diario y una interfaz web que funciona sin conexión.

## Ejecución

Entregas semanales con la dueña frente a la pantalla. Cada pantalla se probó con datos reales del mes anterior.

## Resultados y evidencia

El cierre de mes bajó de dos días a cuatro horas, según la bitácora de cierres. Mi rol: diseño, código y capacitación.

## Qué haría distinto

Mediría la línea base desde el inicio y automatizaría los respaldos fuera del sitio desde la primera entrega.
