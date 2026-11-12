---
title: A peak-season outage turned into a prevention plan
summary: 'Demo case: the postmortem changed how we deploy; a rollback now takes under 20 minutes.'
translationKey: demo-incident
role: On-call engineer
period: { start: 2022-11-01, end: 2022-12-15 }
competencies: [incidents]
stack: [Node.js, PostgreSQL]
cover: ../covers/incident.svg
confidentiality: anonymized
anonymizationNote: Demo data. The company, figures and links are illustrative.
evidence:
  - { kind: artifact, label: Postmortem, url: 'https://example.com/demo/postmortem' }
  - {
      kind: metric,
      label: Rollback in 18 min,
      method: 'Incident timeline in the postmortem (demo).',
    }
lessons: I would have rehearsed the rollback before peak season; the first real attempt was during the outage.
---

## Context

At peak season, checkout started returning 5xx errors after a deploy.

## Constraints

Every minute down cost sales. There was no written rollback procedure.

## Options and decision

Fix forward or roll back. I rolled back: the cause was unclear and rolling back had the fewest unknowns.

## Architecture

Before: manual deploys with no version tag. After: versioned images and a one-command rollback.

## Execution

Alert at 21:04, rollback at 21:09, stable at 21:22. The blameless postmortem shipped within 48 hours.

## Results and evidence

A rollback now takes under 20 minutes, measured on the postmortem timeline. My role: on call and postmortem author.

## What I would do differently

Rehearse the rollback every month, not only after an incident.
