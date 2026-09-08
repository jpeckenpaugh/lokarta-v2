# Stage 1 — Concept Seed (Human Role)

## Role / Purpose

Establish the seed concept for the product. The seed's depth is the human's
choice: enough to **shape** the app, or more — the pipeline is built to ratify
richer seeds, not to fight them (see the seed contract in `00-README.md`). This
stage is a **human role**, not an agent dispatch: `concept.md` is supplied by
the human (the seed the pipeline builds from). The author is the human, possibly
assisted by the Stage Manager — who may transcribe the human's answers or author
the file on the human's behalf while holding to the template. The human owns
`concept.md` and edits it directly whenever they choose (for example to change
the default stack); no stage or agent does that for them.

Because `concept.md` is normally created before the workflow starts, this stage
is **skipped when the file already exists**. If it is missing, the stage runs a
brainstorming session with the human to produce it.

## Inputs

- The human's idea / stakeholder discussion.
- Optional: `concept-examples/` — example seed concepts to copy and customize.
- Nothing upstream in the pipeline (this is the seed stage).

## Outputs

- `concept.md` — a seed concept in the `concept-examples/` template shape,
  stating:
  - Product identity and purpose (what it is and why it exists).
  - The target user.
  - The **default baseline stack** (Web App / Bootstrap frontend /
    FastAPI+SQLite backend), phrased as a starting template the human may
    substitute — not a mandate.
  - App-appropriate **basic seed data** to start with (e.g. a small default set
    of records).
  - Major **capabilities** (what the product does).

The template elements above are the **minimum floor**, not a ceiling. The human
may seed a richer concept — scope boundaries (in/out), precise rules and
numbers, even architecture or contract sketches — and the pipeline is built to
ratify that detail, not to fight it (see the seed contract in `00-README.md`).
The human decides the seed's depth; whatever they seed is binding downstream.

## Instructions

1. **Check whether `concept.md` already exists.**
   - If it **does**: the stage is already complete. Do not modify or overwrite
     it. Write your summary noting "skipped — seed present" and stop.
   - If it **does not**: proceed to the brainstorming session below.
2. **Run a brainstorming session with the human** to elicit, in plain language:
   - Product identity and purpose, the target user, and major capabilities.
   - The app-appropriate basic seed data to start with.
   - The human is the author; the Stage Manager guides the discussion with
     questions and may transcribe answers or author the file on the human's
     behalf.
3. **Produce `concept.md`** either from scratch or by copying one of the
   `concept-examples/` concepts and customizing it to the discussion.
4. **Follow the template.** Include the required elements (see "Outputs"),
   mirroring the `concept-examples/` shape (see `concept-language-tutor.md`).
   The template shape is the minimum floor; a richer seed is acceptable when
   the human supplies it. Use the default stack (Web App / Bootstrap /
   FastAPI+SQLite) as the starting template; the human may substitute their own
   (e.g. MDL + Django + Postgres).
5. **Shape, don't constrain — unless the human seeds otherwise.** A thin seed
   gives downstream roles enough to shape the app (identity, capabilities,
   scope) while leaving data-model and implementation decisions to later
   stages. Where the human provides such detail, preserve it verbatim and let
   downstream stages ratify it. Do **not** descend into entities, fields,
   status lists, API contracts, schemas, or role mechanics *on the human's
   behalf* — those are decided by later stages unless the human supplies them.
6. **Obtain human approval** of `concept.md` before completing the stage.
7. Write your summary file (see below).

## What NOT to do

- Do NOT modify or overwrite an existing `concept.md`; the human owns the seed
  and edits it directly if they choose.
- Do NOT invent data-model or implementation detail the human has not supplied
  (entities, fields, status lists, API routes, schemas, packages, or role
  mechanics). Detail the human *does* supply is preserved verbatim, not added to.
- Do NOT design the architecture or technical implementation on the human's
  behalf.
- Do NOT add features that were not requested.
- Do NOT treat the default stack as a hard mandate; it is a starting template
  the human may substitute.
- Do NOT omit the template's required elements (identity, default stack, seed
  data, capabilities) from the seed.
- Do NOT produce code or configuration of any kind.
- Do NOT move into implementation details the human has not provided; stay at
  the product level unless the human seeds deeper.

## Summary

Write `summaries/01-write-concept.md` using `summaries/00-template.md`. Record
whether the stage was skipped (seed already present) or what brainstorming
produced, plus any open questions or concerns about product scope that the next
stages (or a human) should address.

As the final step, commit your changes to the current branch and push to
`origin`, using a message in the form `stage 01: <brief summary>`. The human
commits (or directs the Stage Manager to commit) the human-authored seed.