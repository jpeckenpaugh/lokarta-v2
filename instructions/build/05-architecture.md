# Stage 5 — Architect

## Role / Purpose

Translate product requirements into a technical specification: the *shape* of
the code without the code itself. This stage decides structure, data, and
contracts so downstream engineers can implement independently.

## Inputs

- `concept.md` (Stage 1).
- `features/briefs/*.md` (Stage 3).
- Environment definition: `requirements.txt`, `environment-notes.md` (Stage 4).

## Outputs

- `docs/architecture.md` — a technical specification. Create the `docs/` folder.
  It describes:
  - Project/file structure.
  - Module boundaries.
  - Data model and SQLite (or chosen DB) schema.
  - API contracts.
  - Backend/frontend responsibilities.
  - Component interactions.

## Instructions

1. Read `concept.md`, `features/briefs/*.md`, and the environment definition
   (`requirements.txt`, `environment-notes.md`).
2. **Ratify the seed's architecture.** `concept.md` may already state
   architecture primitives, module or engine boundaries, a client/server split,
   API contracts, or component responsibilities (for example an "Architectural
   Primitives" or technology-stack section). Treat such statements as
   human-ratified requirements (per the seed contract in `00-README.md`):
   elaborate them into `docs/architecture.md` rather than designing an
   alternative from scratch. If you judge a stated choice conflicts with the
   feature briefs or with product intent, record the conflict and your
   recommended resolution in your summary, and flag it to the human before
   finalizing rather than silently deviating from a stated contract.
3. Create the `docs/` folder and write the specification to
   `docs/architecture.md`.
4. Define the project/file structure and module boundaries.
5. Define the data model and the database schema needed to support the
   features (including persistence of application state as required).
6. Specify the API contracts (routes, methods, payloads, responses) that the
   backend must expose and the frontend must consume. Align with any routes or
   contracts the seed states; re-specify only where they are underspecified.
7. Clearly separate backend responsibilities from frontend responsibilities.
8. Describe how components interact and how application state flows.
9. Produce the specification as reference documentation, not code.
10. Write your summary file (see below).

## What NOT to do

- Do NOT implement application code.
- Do NOT silently rewrite product requirements or feature behavior.
- Do NOT silently design an alternative to architecture, module, or contract
  decisions the human stated in `concept.md`; ratify and elaborate them, or
  flag the conflict (see instruction 2).
- Do NOT change the approved environment without flagging it.
- Do NOT leave the API/data contracts so vague that engineers must guess.
- Do NOT design unrelated architecture beyond what the requirements demand.

## Summary

Write `summaries/05-architecture.md` using `summaries/00-template.md`.
Summarize the architecture at a high level and flag any unresolved design
decisions, contract ambiguities, or schema concerns that backend and frontend
engineers will need clarified before implementation.

As the final step, commit your changes to the current branch and push to
`origin`, using a message in the form `stage 05: <brief summary>`.