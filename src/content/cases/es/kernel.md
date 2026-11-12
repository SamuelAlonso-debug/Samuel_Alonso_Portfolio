---
title: Un kernel educativo con releases que puedes verificar
summary: 'Caso de demostración: cada versión publica su suma SHA-256, arranca en QEMU y pasa 48 pruebas con un comando.'
translationKey: demo-kernel
role: Autor
period: { start: 2023-06-01 }
competencies: [lifecycle]
stack: [C, x86-64 assembly, QEMU]
cover: ../covers/kernel.svg
confidentiality: public
evidence:
  - { kind: repo, label: Código, url: 'https://example.com/demo/minikernel' }
  - { kind: artifact, label: Release 0.4.2, url: 'https://example.com/demo/minikernel/releases' }
lessons: Habría escrito las pruebas del planificador antes que el planificador; dos regresiones salieron de ahí.
---

## Contexto

Un kernel pequeño para aprender cómo arranca un sistema operativo, pensado para que otros lo lean y lo compilen.

## Restricciones

Sin dependencias fuera de un compilador de C y QEMU. Cada release debía poder verificarse sin confiar en mí.

## Opciones y decisión

Descarté publicar solo el código: compilar un kernel desde cero espanta. Publico la imagen, su suma SHA-256 y el comando para reproducirla.

## Arquitectura

Arranque, memoria, planificador round robin y una shell mínima, cada uno en su módulo con pruebas propias.

## Ejecución

La integración continua compila la imagen, la arranca en QEMU y corre 48 pruebas antes de publicar.

## Resultados y evidencia

Cualquiera verifica una release con `sha256sum -c` y la reproduce con `make`. Mi rol: autor único.

## Qué haría distinto

Escribiría primero las pruebas del planificador y documentaría el mapa de memoria con un diagrama.
