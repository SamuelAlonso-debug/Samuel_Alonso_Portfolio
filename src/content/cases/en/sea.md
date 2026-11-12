---
title: An admin system a shop runs without daily support
summary: 'Demo case: month-end close went from two days to one afternoon with stock, sales and expenses in one system.'
translationKey: demo-sea
role: Software engineer, end to end
period: { start: 2024-01-01, end: 2024-09-30 }
competencies: [architecture, ux]
stack: [Astro, TypeScript, SQLite]
cover: ../covers/sea.svg
confidentiality: anonymized
anonymizationNote: Demo data. The client, figures and links are illustrative.
evidence:
  - { kind: repo, label: Code, url: 'https://example.com/demo/sea' }
  - { kind: video, label: Video, url: 'https://example.com/demo/sea-video' }
  - { kind: metric, label: Close in 4 h, method: 'Month-end close log, before and after (demo).' }
lessons: I would have timed the close from week one, not at the end; the baseline came from memory.
---

## Context

A grocery shop kept stock, sales and expenses in three spreadsheets. Every month-end close took two days.

## Constraints

One person would run the system, with no daily tech support and a flaky connection.

## Options and decision

I compared a commercial ERP with a small custom system. I picked the latter: the ERP needed training and licenses the shop could not sustain.

## Architecture

Before: three unrelated sheets. After: a local SQLite database with daily backups and a web UI that works offline.

## Execution

Weekly releases with the owner at the screen. Every screen was tested with real data from the previous month.

## Results and evidence

Month-end close dropped from two days to four hours, per the close log. My role: design, code and training.

## What I would do differently

Measure the baseline from the start and automate off-site backups from the first release.
