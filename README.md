# CyberLehia webgunea

Static website for **[CyberLehia](https://cyberlehia.fpeuskadi.eus/)**, the cybersecurity CTF championship and student event of Basque Vocational Training (Lanbide Heziketa / Formación Profesional). It is promoted by the Basque Government's Deputy Ministry of Vocational Training and CyberZaintza, with Tknika.

Built with **[Hugo](https://gohugo.io/)** and **[Tailwind CSS v4](https://tailwindcss.com/)**. All content is Markdown, in two languages: **Euskara** (default, served at `/`) and **Castellano** (served at `/es/`).

> Working on this repo with an AI agent? See [AGENTS.md](AGENTS.md).

---

## Quick start

Requirements:

| Tool | Version | Notes |
| --- | --- | --- |
| [Hugo **extended**](https://gohugo.io/installation/) | ≥ 0.146 (CI uses 0.168.0) | The template layout (`layouts/_partials`, `home.html`…) needs ≥ 0.146 |
| [Node.js](https://nodejs.org/) | ≥ 20 (CI uses 24) | Hugo runs the Tailwind CLI from `node_modules` |

```sh
git clone https://github.com/tknika/cyberlehia.git
cd cyberlehia
npm ci            # installs tailwindcss + @tailwindcss/cli
hugo server       # → http://localhost:1313 (live reload)
```

Production build (output in `public/`):

```sh
hugo --gc --minify
```

> The Tailwind **standalone binary does not work** with recent Hugo versions: Hugo 0.16x expects the npm package and runs it through Node. Always use `npm ci`.

---

## Deployment

Every push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which builds the site and publishes it to **GitHub Pages** (`https://tknika.github.io/cyberlehia/`). Pull requests are built but not deployed.

- The workflow overrides `baseURL` with the Pages URL, so the same code works under a subpath (`/cyberlehia/`) and on the production domain.
- One-time setup: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
- To serve the production domain (`cyberlehia.fpeuskadi.eus`) from GitHub Pages, set it as the custom domain in *Settings → Pages* and point its DNS to GitHub.

---

## Project structure

```
.
├── hugo.toml                  # Site config: languages, params, organizer logos, Tailwind build
├── package.json               # Tailwind CSS (npm), the only Node dependency
├── content/
│   ├── eu/                    # Euskara (default language, served at /)
│   └── es/                    # Castellano (served at /es/)
├── static/images/             # Photos, logos, video poster (served as /images/…)
├── themes/cyberlehia/         # The theme (layouts, CSS, JS, i18n, fonts)
└── .github/workflows/         # GitHub Pages CI
```

### Site map (same in both languages)

| Euskara (`content/eu/`) | Castellano (`content/es/`) | `translationKey` |
| --- | --- | --- |
| `_index.md` (home) | `_index.md` | (automatic) |
| `ezagutu-cyberlehia/_index.md` | `conoce-cyberlehia/_index.md` | `about` |
| ├ `parte-hartu.md` | ├ `participa.md` | `participate` |
| ├ `faseak-eta-oinarriak.md` | ├ `fases-y-bases.md` | `rules` |
| └ `sariak.md` | └ `premios.md` | `prizes` |
| `4-edizioa/_index.md` | `4-edicion/_index.md` | `edition-4` |
| `aurreko-edizioak/` (`2024.md`, `2025.md`, `2026.md`) | `ediciones-previas/` | `editions`, `edition-YYYY` |
| `prentsa-gunea/_index.md` | `sala-de-prensa/_index.md` | `press` |
| ├ `argazki-bilduma.md` | ├ `galeria-de-fotos.md` | `press-photos` |
| ├ `testigantzak.md` | ├ `testimonios.md` | `press-testimonials` |
| ├ `bideoak.md` | ├ `videos.md` | `press-videos` |
| └ `adibidea.md` (draft template) | └ `ejemplo.md` (draft template) | `press-example` |
| `kontaktua.md` | `contacto.md` | `contact` |
| `lege-oharra.md` | `aviso-legal.md` | `legal` |
| `pribatutasun-politika.md` | `politica-de-privacidad.md` | `privacy` |
| `cookie-politika.md` | `politica-de-cookies.md` | `cookies` |

---

## Editing content

Each page is a Markdown file with YAML front matter. Common fields:

```yaml
---
title: Sariak                   # page title (H1)
linkTitle: Sariak               # optional shorter title for menus and breadcrumbs
translationKey: prizes          # SAME value in eu and es: links the two translations
eyebrow: Sariak                 # small label above the title
description: One sentence.      # subtitle, meta description and card text
weight: 30                      # order inside its section (lower first)
image: images/edizioa-2026.jpg  # card/header image: path under static/, no leading slash
header_image: images/final.jpg  # optional photo behind the page title band (darkened for contrast); replaces the in-article `image`
menus:
  main:
    parent: ezagutu             # submenu of "Ezagutu CyberLehia"
    weight: 30
---
```

### Common tasks

**Add a page.** Create the `.md` in both `content/eu/…` and `content/es/…` with the same `translationKey`. Add `menus:` if it should appear in the navigation.

**Menus** are defined in front matter, not in `hugo.toml`:
- `main`: the header menu. *Ezagutu CyberLehia* has `identifier: ezagutu`, and its subpages use `parent: ezagutu`.
- `footer`: the legal links in the footer.

**Home page** (`content/<lang>/_index.md`):

| Field | What it controls |
| --- | --- |
| `video.src` | Self-hosted MP4 background loop (preferred): `videos/hero.mp4`, made with `scripts/encode-hero-video.sh` |
| `video.webm` | Optional VP9 version of the same loop (`videos/hero.webm`), smaller; used first where supported |
| `video.youtube` | YouTube ID used when there is no `video.src` (currently `5rsiuSXlulo`, "CyberLehia 2026 laburpena") |
| `video.poster` | Hero image: always shown first, and the only thing shown with reduced motion, Save-Data, a 2G connection, blocked autoplay, or on screens under 768px. Currently `images/edizioa-2025.jpg` (the 2025 venue with the FP Euskadi · CyberLehia screen, no people) |
| `about.title` + page body | The "Zer da CyberLehia?" section |
| `benefits` | "Parte hartzearen abantailak": `title`, `text`, `items`, `button` label |
| `press.section` | Section whose first 3 pages (by `weight`) are shown as cards |

**"Parte hartu" registration button.** Set `registrationURL` per language in `hugo.toml` (`[languages.eu.params]`, `[languages.es.params]`); an empty string hides the button. Use the **public** LimeSurvey URL (`https://galdetegiak.tknika.eus/index.php/<surveyID>?lang=eu`), not the `surveyAdministration` admin URL, which requires a Tknika login.

**Current edition and phases.** The page with `current_edition: true` (now `4-edizioa`) provides the `phases` shown over the home video and by the `{{< timeline >}}` shortcode:

```yaml
phases:
  - title: Izen-ematea
    dates: 2026/12/15 – 2027/01/20
    status: active          # done | active | upcoming (default)
    description: Optional text (shown by the timeline shortcode).
    items: [Optional, bullet list]
```

**Updating the current edition as it goes.** Besides `phases`, the current edition page has two lists the organisers fill in over time (an empty value shows "Laster" / "Próximamente"):

```yaml
facts:                       # key facts row at the top of the page
  - label: Final handia
    value: "<data>"            # "" until confirmed
results:                     # standings, shown where {{< results >}} is in the text
  - title: Finalerako sailkatuak
    url: "<url>"              # content path (/…/) or full URL; "" until published
```

Typical order through an edition: registration open (phase `active`, registration button) → each online phase ends (move `status`, add the results `url`) → final announced (fill the final date, venue and programme) → winners (add the last result, update `facts`).
**New edition.** Move the current edition page into `aurreko-edizioak/` as `YYYY.md` (with `weight: YYYY` and every phase `status: done`), create the new edition section with `current_edition: true`, update its menu entry, and repeat in `es/`.

**Press dossier (PDF).** `static/docs/cyberlehia-prentsa-txostena.pdf` (eu) and `cyberlehia-dossier-prensa.pdf` (es), linked from Prentsa gunea / Sala de prensa. They are generated from `scripts/press-kit/build.js` (texts in both languages + aggregate figures at the top of the file) with headless Edge/Chrome: `node scripts/press-kit/build.js`. Update the figures and texts each edition, regenerate and commit the PDFs. Only aggregate figures, never personal data from the participant workbook.

**Press release.** Copy `prentsa-gunea/adibidea.md` (and `sala-de-prensa/ejemplo.md`), give it `weight` ≥ 100 so it appears after the three fixed cards, and remove `draft: true`.

**Footer logos.** Edit `[[params.organizers]]` in `hugo.toml` (`name`, optional `logo`, `url`). Without `logo`, the name is shown as text.

**Images.** Put them in `static/images/` and reference them as `images/file.jpg` in front matter, or `/images/file.jpg` in Markdown links.

**Internal links in Markdown.** Write them from the language root: `/4-edizioa/` (eu) or `/4-edicion/` (es). The theme adds the language prefix and the base path automatically.

### Shortcodes

| Shortcode | Usage |
| --- | --- |
| `note` | `{{< note >}}Markdown{{< /note >}}`: info box; `type="warning"` for the pink variant |
| `button` | `{{< button href="/4-edizioa/" >}}Label{{< /button >}}`: `style="ghost"` for the secondary style; `mailto:` and external URLs also work |
| `faq` | `{{< faq "Question?" >}}Markdown answer{{< /faq >}}`: collapsible; wrap a group in `{{< stack >}}…{{< /stack >}}` |
| `timeline` | `{{< timeline >}}`: phases of the current edition |
| `results` | `{{< results >}}`: the page's `results` list ("Laster" until each one has a `url`) |
| `gallery` | one `path \| caption` per line between `{{< gallery >}}` and `{{< /gallery >}}` |
| `youtube` | `{{< youtube id="VIDEO_ID" title="…" >}}`: privacy-enhanced (youtube-nocookie) embed |
| `videos` | `{{< videos >}}` with one `VIDEO_ID | Title` per line: tiles with a self-hosted preview that load the YouTube player only on click (run `scripts/fetch-video-thumbs.sh` after adding videos) |

---

## Theme (`themes/cyberlehia`)

```
themes/cyberlehia/
├── assets/
│   ├── css/main.css              # Tailwind entry: @theme tokens, base styles, components (prose-cyber, video-bg…)
│   └── js/main.js                # Mobile menu + background-video loader (bundled with js.Build)
├── i18n/{eu,es}.yaml             # Interface strings
├── layouts/
│   ├── baseof.html               # Page skeleton
│   ├── home.html                 # Home page
│   ├── section.html              # Sections (_index.md): intro + card grid of child pages
│   ├── page.html                 # Regular pages: header, sibling sidebar, prose
│   ├── 404.html
│   ├── _partials/                # head, css, header, footer, lang-switcher, page-header, card, timeline, current-edition
│   ├── _shortcodes/              # note, button, faq, stack, timeline, gallery, youtube
│   └── _markup/render-link.html  # Makes "/…" Markdown links language- and base-path-aware
└── static/                       # favicon.svg, fonts/ (Space Grotesk + JetBrains Mono, SIL OFL)
```

**Design tokens** (in `main.css` → `@theme`):
- Background scale: dark navy `ink-950 … ink-100`.
- Brand colours: `cyan` `#16b2c9` (logo), `pink` `#e95095`, `violet` `#7049ba`, `brand` `#4f5bd5`, and `lime` for terminal-style details.
- Fonts: `font-display` (Space Grotesk), `font-mono` (JetBrains Mono), `font-sans` (system).
- Base font size: 17px.

Tailwind scans the generated `hugo_stats.json` (enabled by `build.buildStats`), so any class used in templates **or in Markdown/HTML content** is included in the CSS.

---

## License

Content: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (see the legal notice). Fonts: SIL Open Font License. Logos belong to their respective owners.
