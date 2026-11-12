---
title: A teaching kernel with releases you can verify
summary: 'Demo case: every version ships its SHA-256 sum, boots in QEMU and passes 48 tests with one command.'
translationKey: demo-kernel
role: Author
period: { start: 2023-06-01 }
competencies: [lifecycle]
stack: [C, x86-64 assembly, QEMU]
cover: ../covers/kernel.svg
confidentiality: public
evidence:
  - { kind: repo, label: Code, url: 'https://example.com/demo/minikernel' }
  - { kind: artifact, label: Release 0.4.2, url: 'https://example.com/demo/minikernel/releases' }
lessons: I would have written the scheduler tests before the scheduler; two regressions came from there.
---

## Context

A small kernel to learn how an operating system boots, built for others to read and compile.

## Constraints

No dependencies beyond a C compiler and QEMU. Every release had to be verifiable without trusting me.

## Options and decision

I ruled out shipping only the code: building a kernel from scratch scares people off. I ship the image, its SHA-256 sum and the command to reproduce it.

## Architecture

Boot, memory, a round-robin scheduler and a minimal shell, each in its own module with its own tests.

## Execution

CI builds the image, boots it in QEMU and runs 48 tests before each release.

## Results and evidence

Anyone verifies a release with `sha256sum -c` and reproduces it with `make`. My role: sole author.

## What I would do differently

Write the scheduler tests first and document the memory map with a diagram.
