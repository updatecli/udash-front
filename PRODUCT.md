# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: engineers triaging updates.** Platform, DevOps and maintainer engineers who run Updatecli in CI across many Git repositories. They open Udash to find what needs a human: pipelines that failed, changes Updatecli applied, and changes waiting in pull requests nobody has merged. They work from a desk and also check in from a phone, often arriving from a pull request or CI notification.
- **Secondary: anonymous visitors to public instances.** People browsing an instance configured as `public` who want to see update health without an account. Design must never break or mislead them, but the design isn't optimised for them.

## Product Purpose

Udash is the web dashboard for Updatecli. Updatecli runners publish their pipeline reports to the Udash API, and Udash turns them into three things:

- activity over time
- a per-repository and per-branch status overview
- the full detail of each report

Success is a triager who can tell within seconds which repositories and branches need action, then drill down to the exact source, condition, target or action responsible.

## Positioning

- **Native to Updatecli.** It speaks Updatecli's own model rather than generic pass/fail. A pipeline has sources, conditions, targets and actions, and its result is one of ✔ ✗ ⚠ -.
- **Surfaces waiting pull requests.** A pipeline reports ✔ when there was nothing to change, including when the change is already waiting in an unmerged pull request. Udash separates those from the genuinely up-to-date ones.
- **Self-hosted, one image.** Operators run it themselves. A single image serves open, public and private instances, configured at runtime.
- **Open source.** Licensed AGPL v3 as part of the Updatecli project.

## Operating Context

- Deployed by operators behind their own nginx, often below a subpath. The runtime `config.json` sets:
  - `APP_BASE_PATH` (the subpath)
  - `API_BASE_URL`
  - `AUTH_ENABLED` and `AUTH_VISIBILITY` (`public` or `private`)
  - the OIDC settings
  - `MAX_HISTORY_DAYS` (1–366, default 30)
- Visibility modes decide what a signed-out visitor sees:
  - **Open** (auth disabled): everything is readable.
  - **Public**: data is readable. Signing in adds the profile and API tokens pages.
  - **Private**: data requires a session. A signed-out home page shows only the hero and a sign-in prompt.
- Runners authenticate with personal API tokens (`udash_pat_…`) created on the Tokens page, via `updatecli udash login` or environment variables in CI.
- The first-run path is: install Updatecli, authenticate, then run with `--experimental` to publish reports. The home page switches from onboarding to activity once reports exist.
- Many instances hold large report histories, so default queries stay narrow (the last day). Wider windows are only requested when someone asks for them.

## Capabilities and Constraints

- **Routes:**
  - Home: activity chart, or onboarding when there are no reports
  - SCM dashboard: per repository and branch
  - Reports: filter, status overview, report table
  - Report detail: sources, conditions, targets, actions, graph, console output, changelog
  - About
  - Profile and API tokens: auth only
- **Result semantics (binding):**
  - ✔ = ran fine, nothing to change
  - ⚠ = Updatecli **applied a change**. It is not a warning, and must never be labelled "Warning" at pipeline level.
  - ✗ = failed, or a condition did not pass
  - \- = skipped

  On the source, condition and target rows, the same glyphs keep their per-step meaning.
- **Open action:** whether a pipeline carries an open pull request or merge request. This is a separate dimension from the result, not a fifth result.
- **Filter state** is shareable in the URL and persisted per instance in localStorage, with keys scoped by base path.
- **Stack:** Vue 3, Vuetify 4, Chart.js, highlight.js, mermaid, served as a static SPA. The API enforces its own limits, for example a maximum of 1000 summary buckets and 366 history days.

## Brand Commitments

- The product name is **Udash**, presented as the Updatecli dashboard. The Updatecli logo is `updatecli.png`, served from the app base path.
- The footer credits the Updatecli Project.
- The About page and the licence stay reachable by anonymous visitors on every visibility mode.

## Evidence on Hand

- There are no testimonials, customer logos, adoption numbers or benchmarks, and none should be invented.
- The only real content is live report data from each instance, plus the Updatecli project links: GitHub, the Matrix chat, the docs at updatecli.io, and the issue tracker.

## Product Principles

1. **Attention first.** Lead with what needs a human: failures, applied changes, waiting pull requests. "All fine" should be quiet.
2. **Never misstate a result.** Labels, colours and charts follow Updatecli's result semantics exactly. An unknown or refused state is shown as unknown, never as "empty" or "fine".
3. **Safe by default for operators.** Nothing exposes data or widens load because someone upgraded without editing config. Defaults are the conservative choice.
4. **One build, every deployment.** Features must work across open, public and private modes and under any base path, without rebuilding.

## Accessibility & Inclusion

- Light and dark themes are equally first-class. Every surface must be readable and correct in both, plus the "system" mode that follows the OS.
- Phone check-ins are a real use case. Triage views must work on a narrow viewport, not just avoid breaking.
- There is no formal WCAG commitment on record. Status must never depend on colour alone: the result glyphs travel with the colour.
