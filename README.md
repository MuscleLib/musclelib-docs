Source of the static documentation for the MuscleLib API (landing page + docs), with support for multiple languages and light/dark themes.  
The build process generates final files in `dist/`, ready for deployment or to be copied into another project.

## Structure

- `docs/templates/` – HTML templates (with placeholders)
- `docs/content/<lang>/ui.json` – short texts (labels, titles, etc.)
- `docs/content/<lang>/terms.md` and `docs/content/<lang>/privacy.md` – long-form content (Markdown)
- `docs/page/` – assets (CSS/JS/images/404.html)
- `tools/build.js` – build script that compiles content + templates and generates `dist/<lang>/...`
- `dist/` – generated output

## Template placeholders

- `{{t:my.key}}` – fetches a string from `ui.json`
- `{{var}}` – simple variable (e.g. `lang`, `github_url`)
- `{{{raw}}}` – raw HTML (e.g. `terms` and `privacy` converted from Markdown)

If a key does not exist, it appears as `[[my.key]]` in the generated HTML to make review easier.

## Requirements

- Node.js 18+ (recommended)
- npm

## Local build

```bash
npm install
npm run build
````

Open `dist/en/index.html` (or `dist/pt/index.html`), or serve `dist/` with a static server:

```bash
npx serve dist
# or
python -m http.server -d dist
```

Tip: the build also generates `dist/index.html` and `dist/docs/index.html` as redirects to the English version, and `dist/404.html` for the error page.

## Deploy (Vercel)

The deployment is fully static, and `vercel.json` defines:

* `outputDirectory`: `dist`
* rewrites for friendly routes (`/`, `/docs`, `/pt/docs`, etc.)

## Contributing

* Edit templates in `docs/templates/`
* Update texts in `docs/content/en` and `docs/content/pt`
* Run `npm run build` to validate the output in `dist/`