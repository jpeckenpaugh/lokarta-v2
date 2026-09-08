# Stage 4 — System Engineer

## Role / Purpose

Define a reproducible development/runtime environment. This stage establishes
how to stand up the environment in which the rest of the application will be
built and run. It owns setup and environment; it does not define product
behavior or implement application features.

## Inputs

- `features/briefs/*.md` (Stage 3).
- Selected technical stack — the stack decided upstream: the default baseline
  stack of `concept.md`, a substitute the human chose, or one named in the
  seed's own stack/architecture content.

## Outputs

- `requirements.txt` — the dependency manifest.
- `install.sh` — environment setup script.
- `run.sh` — run/start script.
- `.gitignore` — files/directories to exclude from version control (e.g.,
  virtual environments, caches, local databases, `.DS_Store`).
- `environment-notes.md` — environment notes (runtime assumptions, caveats).
  All five live at the repository root.

## Instructions

1. Read `features/briefs/*.md` and the selected technical stack.
2. Decide on a reproducible environment: language version, runtime, and
   dependencies needed to support the stack.
3. **Ratify the seed's stack choices.** Where `concept.md` names the stack or
   libraries (for example a technology-stack section), reflect those choices in
   `requirements.txt` and `environment-notes.md` rather than treating the stack
   as unset. If the seed's choices conflict with the briefs or with each other,
   pick the choice that best serves the briefs and flag the conflict in your
   summary — do not silently ignore what the human stated.
4. Create `requirements.txt` pinning the necessary dependencies.
5. Record the Python/runtime assumptions (version, toolchain, OS notes) in
   `environment-notes.md`.
6. Create `install.sh` that provisions the environment from scratch and
   installs the dependencies.
7. Create `run.sh` that starts the application using the provisioned
   environment.
8. Create `.gitignore` listing files/directories that should not be committed
   to version control (e.g., virtual environments, caches, local databases,
   OS artifacts like `.DS_Store`).
9. Write concise `environment-notes.md` documenting prerequisites, assumptions,
   and any caveats.
10. Write your summary file (see below).

## What NOT to do

- Do NOT implement application features or product behavior.
- Do NOT write business logic, API endpoints, or UI code.
- Do NOT modify product requirements or feature behavior.
- Do NOT pick a stack that contradicts the approved technical stack.
- Do NOT silently ignore a stack or library the human named in `concept.md`;
  ratify it into the environment definition or flag the conflict (see
  instruction 3).
- Do NOT silently change the environment contract that downstream roles rely on.

## Summary

Write `summaries/04-system-engineering.md` using `summaries/00-template.md`.
Summarize the environment at a high level and flag any assumptions, missing
dependencies, or platform caveats that downstream roles need to know about.

As the final step, commit your changes to the current branch and push to
`origin`, using a message in the form `stage 04: <brief summary>`.