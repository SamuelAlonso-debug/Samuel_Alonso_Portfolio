---
title: Una caída en temporada alta, convertida en un plan de prevención
summary: 'Caso de demostración: el postmortem cambió cómo desplegamos; un rollback ahora toma menos de 20 minutos.'
translationKey: demo-incident
role: Ingeniero de guardia
period: { start: 2022-11-01, end: 2022-12-15 }
competencies: [incidents]
stack: [Node.js, PostgreSQL]
cover: ../covers/incident.svg
confidentiality: anonymized
anonymizationNote: Datos de demostración. La empresa, las cifras y los enlaces son ilustrativos.
evidence:
  - { kind: artifact, label: Postmortem, url: 'https://example.com/demo/postmortem' }
  - {
      kind: metric,
      label: Rollback en 18 min,
      method: 'Línea de tiempo del incidente en el postmortem (demostración).',
    }
lessons: Habría practicado el rollback antes de la temporada alta; el primer intento real fue durante la caída.
---

## Contexto

En plena temporada alta, el checkout empezó a devolver errores 5xx después de un despliegue.

## Restricciones

Cada minuto caído costaba ventas. No había un procedimiento de rollback escrito.

## Opciones y decisión

Corregir hacia adelante o revertir. Revertí: la causa no estaba clara y revertir era la opción con menos incógnitas.

## Arquitectura

Antes: despliegues manuales sin marca de versión. Después: imágenes versionadas y un rollback de un comando.

## Ejecución

Alerta a las 21:04, rollback a las 21:09, servicio estable a las 21:22. El postmortem sin culpables salió en 48 horas.

## Resultados y evidencia

Un rollback ahora toma menos de 20 minutos, medido en la línea de tiempo del postmortem. Mi rol: guardia y autor del postmortem.

## Qué haría distinto

Practicaría el rollback cada mes, no solo después de un incidente.
