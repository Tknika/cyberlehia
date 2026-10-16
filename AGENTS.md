# AGENTS.md

Instructions for AI coding agents (and humans) working on this repository. Read [README.md](README.md) first for the project overview, site map and content model; this file covers the rules and gotchas.

## Project in one paragraph

Bilingual (Basque `eu` = default at `/`, Spanish `es` at `/es/`) static site for the CyberLehia cybersecurity CTF championship, built with **Hugo ≥ 0.146 (extended)** and **Tailwind CSS v4 via npm**, using a custom theme in `themes/cyberlehia`. It deploys to GitHub Pages through `.github/workflows/pages.yml` on every push to `main`. The production domain is `cyberlehia.fpeuskadi.eus`.

## Commands

```sh
npm ci                                   # once: installs Tailwind (required by Hugo)
hugo server                              # dev server on http://localhost:1313
hugo --gc --minify                       # production build → public/
hugo --gc --minify --baseURL https://tknika.github.io/cyberlehia/ -d /tmp/out   # test a subpath build
```

There is no test suite. **A change is verified when:**
1. `hugo --gc --minify` finishes with no `ERROR` and no `WARN` lines.
2. A build with a subpath `baseURL` (command above) has no links that miss the prefix:
   `grep -rhoE '(href|src|poster)="?/[^" >]*' /tmp/out --include=*.html | grep -vE '="?/cyberlehia/'` prints nothing (minified HTML leaves most attributes unquoted, hence the `"?`).
3. For visual changes, check the pages in a browser (or headless Chrome screenshots) at ~1440px, ~1024px and ~390px wide, in **both** languages.

## Hard rules

1. **Both languages, always.** Every content change in `content/eu/` needs the matching change in `content/es/` (and vice versa), with the same `translationKey`. Every new UI string goes in both `themes/cyberlehia/i18n/eu.yaml` and `es.yaml`. Use `{{ i18n "key" }}` in templates and never hardcode Basque or Spanish text in layouts.
2. **Basque is the source language.** The Spanish slugs and texts are translations; keep the URLs of the legal pages (`lege-oharra`, `pribatutasun-politika`, `cookie-politika`, `es/aviso-legal`, `es/politica-de-privacidad`, `es/politica-de-cookies`) and of `aurreko-edizioak` / `es/ediciones-previas` stable, because they match the old WordPress site.
3. **Never hardcode URLs** in templates. Use `.RelPermalink`, `relURL`, `relLangURL` or `absURL`. Asset paths passed to `relURL` must **not** start with `/` (use `images/x.jpg`, not `/images/x.jpg`), or the GitHub Pages subpath is lost. In CSS, reference `static/` files with relative URLs (`../fonts/…`). In Markdown, write internal links as `/path/` without the language prefix (`/kontaktua/`, `/images/x.png`): `_markup/render-link.html` turns pages into `relLangURL` and files (anything with an extension) into `relURL`.
4. **Don't invent facts.** Dates, venues, prizes, results, testimonials and press coverage come from the organisers. If a fact is unknown, use the existing placeholders ("Laster" / "Próximamente", or a `{{< note >}}`) and say so in your summary.
5. **Tailwind: npm only.** Hugo 0.16x refuses the standalone `tailwindcss` binary ("not a Node.js script"). Don't add PostCSS, a `tailwind.config.js` or extra npm packages unless asked; Tailwind v4 is configured in CSS (`@theme` in `assets/css/main.css`).
6. **Don't commit build output:** `public/`, `resources/_gen/`, `node_modules/`, `hugo_stats.json` and `.hugo_build.lock` are git-ignored.
7. **Keep it static and light.** No tracking scripts, no new third-party requests (the cookie policy depends on it). The only third party is the YouTube embed (youtube-nocookie + the IFrame API), used when no self-hosted `video.src` is set.

## Hugo conventions used here

- **Template layout (Hugo ≥ 0.146):** `layouts/baseof.html`, `home.html`, `section.html`, `page.html`, `404.html`, with `layouts/_partials/`, `layouts/_shortcodes/` and `layouts/_markup/`. Don't create the old `layouts/_default/` or `layouts/partials/` folders.
- **Content dirs per language:** `languages.<lang>.contentDir` in `hugo.toml`. Translations are matched by `translationKey`, not by file name.
- **Menus come from front matter** (`menus: main` / `footer`). The submenu parent is `identifier: ezagutu` (used in both languages).
- **Current edition:** `partial "current-edition.html"` returns the page with `current_edition: true`. Exactly one per language.
- **Section listing:** `section.html` renders the `_index.md` body, then cards of the child pages ordered by `weight` (`sort: desc` reverses the order, as used for previous editions).
- **Deprecated APIs to avoid** (Hugo 0.158+): `languageName` (use `label`), `.Language.LanguageName` (use `.Language.Label`), `.Language.LanguageCode` (use `.Language.Lang` / `.Language.Locale`).
- `templates.Defer` (in `_partials/css.html`) must be called through `partial`, never `partialCached`.
- Go template: `{{ with A }}…{{ else with B }}` is fine; `{{ if A }}…{{ else with B }}` is not.
- Goldmark `unsafe = true` is enabled, so raw HTML in Markdown and front matter strings (`| markdownify`) is allowed.

## Styling conventions

- Use the theme tokens: `bg-ink-950 … ink-100`, `text-cyan`, `text-pink`, `text-violet`, `bg-brand`, `text-lime`, plus `font-display` / `font-mono`. Don't introduce new hex colours in templates; add a token to `@theme` if one is really needed.
- Reusable component classes live in `@layer components` in `main.css`: `container-site`, `btn-primary`, `btn-ghost`, `card`, `eyebrow`, `text-gradient`, `bg-grid`, `prose-cyber`, `video-bg`.
- In Tailwind v4 you **can't `@apply` a custom component class** (e.g. `@apply btn`). Repeat the utilities instead.
- Markdown output is wrapped in `.prose-cyber`. Inside it, add `not-prose` to any custom HTML block (shortcodes like `timeline`, `gallery` and `youtube` do this) so the prose styles don't leak into it. Prose link styles only apply to `<a>` without a `class`.
- Tailwind only sees classes that appear in `hugo_stats.json` (rendered HTML) or literally in the CSS. Classes built dynamically in templates (e.g. `printf "text-%s" $color`) are not detected, so write full class names.
- Respect `prefers-reduced-motion` (animations use `motion-reduce:`; the background video is never loaded, see below).
- The site is dark-only (`color-scheme: dark`).

## Home page specifics

- The background video area is `.video-bg` (`container-type: size`). The YouTube iframe is sized to *cover* using the picture ratio of the current video (≈2.25:1 letterboxed inside 16:9) and scaled ×1.2 to crop YouTube's UI. If the video changes, recompute the `width`/`height` in `main.css`. A self-hosted MP4 (`video.src`) uses `object-cover` and needs no maths.
- The HTML never downloads video: the poster `<img>` is the hero. `assets/js/main.js` attaches the video after `load` (when idle), and only without reduced motion, Save-Data or 2G. The self-hosted `<video>` uses `<source data-src>` + `preload="none"`; the YouTube iframe is created from `data-youtube-id`. Either one is created only while the hero is on screen and the viewport is ≥ 768px (re-checked on resize: narrowing pauses it and shows the poster again), fades in only once it is playing, and pauses off-screen or in a background tab.
- To make the self-hosted loop from an original file: `scripts/encode-hero-video.sh <file> [start] [duration]` (needs ffmpeg), then set `video.src` / `video.webm` / `video.poster` in both `_index.md` files.
- The phase bar under/over the video is informative only (no links). `status: active` gets the cyan→pink top line and a pulsing dot.

## Git & CI

- Default branch: `main`. Work on a branch and open a PR; the workflow builds PRs (without deploying) so you can see build errors.
- CI pins `HUGO_VERSION` and `NODE_VERSION` in `.github/workflows/pages.yml`. If you use a newer Hugo feature locally, bump the CI version in the same PR.
- Commit `package-lock.json` whenever `package.json` changes (CI uses `npm ci`).

## Open items (as of 2026-10)

- 4th edition dates, rules, venue and prizes: unknown, shown as "Laster" / "Próximamente".
- FP Euskadi logo is a small 111×109 PNG from the old site; replace it with an SVG or larger PNG if available.
- Testimonials page is a placeholder.
- The cookie policy (copied from WordPress) still lists `_pk_*` analytics cookies that the static site doesn't set; it needs a legal review.
- `registrationURL` points to last edition's (expired) LimeSurvey form; update it with the new survey ID.
- Replace the YouTube background with a short self-hosted loop (`video.src`): needs the original video file from the organisers (see `scripts/encode-hero-video.sh`).
