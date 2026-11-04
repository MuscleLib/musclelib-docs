import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import { examples } from "../docs/content/examples.js";

// ===== FIX __dirname EM ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIG =====
const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const DIST = path.resolve(process.env.DIST_DIR || path.join(ROOT, "dist"));

if (
  DIST === ROOT ||
  DIST === DOCS ||
  DIST.startsWith(`${DOCS}${path.sep}`) ||
  ROOT.startsWith(`${DIST}${path.sep}`)
) {
  throw new Error(`Unsafe build output directory: ${DIST}`);
}

const LANGS = ["en", "pt", "es"];

const TEMPLATES_DIR = path.join(DOCS, "templates");
const CONTENT_DIR = path.join(DOCS, "content");
const ASSETS_DIR = path.join(DOCS, "assets");
const STATS_FILE = path.join(CONTENT_DIR, "stats.json");

// ===== UTILS =====
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function read(file) {
  return fs.readFileSync(file, "utf-8");
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf-8");
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    ensureDir(dest);
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function loadStats() {
  const stats = JSON.parse(read(STATS_FILE));

  for (const key of ["exercises", "images"]) {
    if (!Number.isSafeInteger(stats[key]) || stats[key] < 0) {
      throw new Error(`Invalid homepage statistic: ${key}`);
    }
  }

  if (
    typeof stats.verifiedAt !== "string" ||
    typeof stats.sourceRepository !== "string" ||
    typeof stats.sourceCommit !== "string"
  ) {
    throw new Error("Homepage statistics must include verification metadata.");
  }

  return stats;
}

// ===== TEMPLATE ENGINE =====
function applyTemplate(template, ctx) {
  let output = template;

  output = output.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
    return ctx[key] ?? "";
  });

  output = output.replace(/\{\{t:([\w.]+)\}\}/g, (_, key) => {
    return ctx.ui[key] ?? `[[${key}]]`;
  });

  output = output.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return ctx[key] ?? "";
  });

  return output;
}

// ===== BUILD =====
console.log("Building MuscleLib Docs...\n");

if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
ensureDir(DIST);

const homepageStats = loadStats();

copyRecursive(path.join(DOCS, "page"), path.join(DIST, "page"));

const notFoundContext = {
  ui: JSON.parse(read(path.join(CONTENT_DIR, "en", "ui.json"))),
};
const notFoundHtml = applyTemplate(
  read(path.join(TEMPLATES_DIR, "404.html")),
  notFoundContext,
);

write(path.join(DIST, "404.html"), notFoundHtml);
write(path.join(DIST, "page", "404.html"), notFoundHtml);

copyRecursive(
  path.join(ASSETS_DIR, "index.html"),
  path.join(DIST, "index.html"),
);

copyRecursive(path.join(ASSETS_DIR, "docs"), path.join(DIST, "docs"));

for (const lang of LANGS) {
  console.log(`Building language: ${lang}`);

  const outDir = path.join(DIST, lang);
  ensureDir(outDir);

  const ui = JSON.parse(read(path.join(CONTENT_DIR, lang, "ui.json")));
  const terms = marked.parse(read(path.join(CONTENT_DIR, lang, "terms.md")));
  const privacy = marked.parse(
    read(path.join(CONTENT_DIR, lang, "privacy.md")),
  );

  const localeExamples = examples[lang];

  const context = {
    lang,
    ui,
    ...Object.fromEntries(
      Object.entries(localeExamples).map(([key, value]) => [
        `example_${key}`,
        value,
      ]),
    ),
    github_url: "https://github.com/MuscleLib",
    issues_url: "https://github.com/MuscleLib/musclelib-api/issues",
    stats_exercises: new Intl.NumberFormat(lang).format(homepageStats.exercises),
    stats_images: new Intl.NumberFormat(lang).format(homepageStats.images),
  };

  const indexTpl = read(path.join(TEMPLATES_DIR, "index.html"));
  write(path.join(outDir, "index.html"), applyTemplate(indexTpl, context));

  const docsTpl = read(path.join(TEMPLATES_DIR, "docs.html"));
  write(path.join(outDir, "docs.html"), applyTemplate(docsTpl, context));

  const legalTpl = read(path.join(TEMPLATES_DIR, "legal.html"));
  const legalPages = [
    { slug: "terms", title: ui["terms.title"], content: terms },
    { slug: "privacy", title: ui["privacy.title"], content: privacy },
  ];

  for (const page of legalPages) {
    write(
      path.join(outDir, `${page.slug}.html`),
      applyTemplate(legalTpl, {
        ...context,
        legal_title: page.title,
        legal_path: page.slug,
        legal_content: page.content,
      }),
    );
  }
}

function validateGeneratedPages() {
  for (const lang of LANGS) {
    const outDir = path.join(DIST, lang);

    for (const page of ["index.html", "docs.html", "terms.html", "privacy.html"]) {
      const file = path.join(outDir, page);

      if (!fs.existsSync(file)) {
        throw new Error(`Missing generated page: ${lang}/${page}`);
      }

      const html = read(file);
      const languageAttribute = new RegExp(
        `<html\\b[^>]*\\blang=["']${lang}["']`,
        "i",
      );

      if (!languageAttribute.test(html)) {
        throw new Error(`Invalid or missing lang attribute in ${lang}/${page}`);
      }
    }

    const homepage = read(path.join(outDir, "index.html"));
    if (!homepage.includes(`href="/${lang}/docs"`)) {
      throw new Error(`Missing documentation navigation for language: ${lang}`);
    }

    if (
      !homepage.includes(`href="https://github.com/MuscleLib/musclelib-api/issues"`) ||
      !homepage.includes("rel=\"noopener noreferrer\"") ||
      !homepage.includes(new Intl.NumberFormat(lang).format(homepageStats.exercises)) ||
      !homepage.includes(new Intl.NumberFormat(lang).format(homepageStats.images))
    ) {
      throw new Error(`Homepage issue link or statistics validation failed for: ${lang}`);
    }
  }
}

validateGeneratedPages();

console.log("\nBuild finished successfully!");
console.log(`Output in ${DIST}`);
