import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const DIST = path.join(ROOT, "dist");
const LANGS = ["en", "pt", "es"];
const GENERATED_PAGES = ["index.html", "docs.html", "terms.html", "privacy.html"];
const REQUIRED_DOC_SECTIONS = [
  "overview",
  "item-1",
  "item-1-1",
  "item-1-2",
  "item-1-3",
  "item-1-4",
  "item-1-5",
  "item-1-6",
  "item-2",
  "item-3",
  "item-3-1",
];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function fail(message) {
  throw new Error(message);
}

function extractIds(html) {
  return new Set(
    [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]),
  );
}

function assertNoUnresolvedPlaceholders(html, file) {
  const unresolved = html.match(/\[\[[\w.]+\]\]|\{\{\{?[\w.:]+\}?\}\}?/g);
  if (unresolved?.length) {
    fail(
      `Unresolved template placeholders in ${file}: ${[...new Set(unresolved)].join(", ")}`,
    );
  }
}

function resolveOutputPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const routes = new Map([
    ["/", "en/index.html"],
    ["/docs", "en/docs.html"],
    ["/404", "404.html"],
  ]);

  for (const lang of LANGS) {
    routes.set(`/${lang}`, `${lang}/index.html`);
    routes.set(`/${lang}/docs`, `${lang}/docs.html`);
    routes.set(`/${lang}/terms`, `${lang}/terms.html`);
    routes.set(`/${lang}/privacy`, `${lang}/privacy.html`);
  }

  const relativePath = routes.get(normalized) ?? normalized.replace(/^\//, "");
  const outputPath = path.resolve(DIST, relativePath);

  if (outputPath !== DIST && !outputPath.startsWith(`${DIST}${path.sep}`)) {
    fail(`Internal route escapes the build output: ${pathname}`);
  }

  return outputPath;
}

function validateInternalLinks(html, sourcePath, publicPath) {
  const baseUrl = new URL(publicPath, "https://musclelib.local");
  const links = [...html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gi)];

  for (const match of links) {
    const href = match[2].replace(/&amp;/g, "&").trim();
    if (!href) continue;

    let target;
    try {
      target = new URL(href, baseUrl);
    } catch {
      fail(`Invalid link in ${sourcePath}: ${href}`);
    }

    if (target.protocol !== "http:" && target.protocol !== "https:") continue;
    if (target.origin !== baseUrl.origin) continue;

    const targetPath = resolveOutputPath(decodeURIComponent(target.pathname));
    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      fail(`Broken internal route in ${sourcePath}: ${href}`);
    }

    if (target.hash) {
      const targetHtml = read(targetPath);
      const targetIds = extractIds(targetHtml);
      const fragment = decodeURIComponent(target.hash.slice(1));
      if (!targetIds.has(fragment)) {
        fail(`Broken internal anchor in ${sourcePath}: ${href}`);
      }
    }
  }
}

const localeData = Object.fromEntries(
  LANGS.map((lang) => {
    const file = path.join(DOCS, "content", lang, "ui.json");
    if (!fs.existsSync(file)) fail(`Missing locale file: ${file}`);

    let data;
    try {
      data = JSON.parse(read(file));
    } catch (error) {
      fail(`Invalid JSON in ${file}: ${error.message}`);
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== "string" || value.trim() === "") {
        fail(`Invalid or empty translation value in ${file}: ${key}`);
      }
    }

    return [lang, data];
  }),
);

const referenceKeys = new Set(Object.keys(localeData.en));
for (const lang of LANGS.slice(1)) {
  const keys = new Set(Object.keys(localeData[lang]));
  const missing = [...referenceKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !referenceKeys.has(key));

  if (missing.length || extra.length) {
    fail(
      `Locale key mismatch for ${lang}. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`,
    );
  }
}

for (const lang of LANGS) {
  for (const page of GENERATED_PAGES) {
    const relativePath = `${lang}/${page}`;
    const file = path.join(DIST, relativePath);
    if (!fs.existsSync(file)) fail(`Missing generated page: ${relativePath}`);

    const html = read(file);
    const languageAttribute = new RegExp(
      `<html\\b[^>]*\\blang=["']${lang}["']`,
      "i",
    );

    if (!languageAttribute.test(html)) {
      fail(`Invalid or missing lang attribute in ${relativePath}`);
    }

    assertNoUnresolvedPlaceholders(html, relativePath);
    validateInternalLinks(html, relativePath, `/${lang}/${page}`);

    if (page === "docs.html") {
      const ids = extractIds(html);
      const missingSections = REQUIRED_DOC_SECTIONS.filter((id) => !ids.has(id));
      if (missingSections.length) {
        fail(
          `Missing required documentation sections in ${relativePath}: ${missingSections.join(", ")}`,
        );
      }
    }
  }
}

const notFoundPath = path.join(DIST, "404.html");
if (!fs.existsSync(notFoundPath)) fail("Missing generated page: 404.html");
const notFoundHtml = read(notFoundPath);
if (!/<html\b[^>]*\blang=["']en["']/i.test(notFoundHtml)) {
  fail("Invalid or missing lang attribute in 404.html");
}
assertNoUnresolvedPlaceholders(notFoundHtml, "404.html");
validateInternalLinks(notFoundHtml, "404.html", "/404");

console.log(
  "Localization and generated-page checks passed for en, pt, and es.",
);
