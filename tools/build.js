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

const LANGS = ["en", "pt", "es"];

const TEMPLATES_DIR = path.join(DOCS, "templates");
const CONTENT_DIR = path.join(DOCS, "content");
// Redirect/entrypoint static pages live in docs/assets (index.html, docs/index.html, ...)
const ASSETS_DIR = path.join(DOCS, "assets");

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

// ===== TEMPLATE ENGINE =====
function applyTemplate(template, ctx) {
  let output = template;

  // {{{raw}}}
  output = output.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
    return ctx[key] ?? "";
  });

  // {{t:key}}
  output = output.replace(/\{\{t:([\w.]+)\}\}/g, (_, key) => {
    return ctx.ui[key] ?? `[[${key}]]`;
  });

  // {{var}}
  output = output.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return ctx[key] ?? "";
  });

  return output;
}

// ===== BUILD =====
console.log("📦 Building MuscleLib Docs...\n");

ensureDir(DIST);

// Assets globais
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
  console.log(`🌍 Building language: ${lang}`);

  const outDir = path.join(DIST, lang);
  ensureDir(outDir);

  // UI texts
  const ui = JSON.parse(read(path.join(CONTENT_DIR, lang, "ui.json")));

  // Markdown → HTML
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
    issues_url: "https://github.com/MuscleLib/MuscleLibAPI/issues",
    stats: {
      exercises: "800+",
      images: "1700+",
    },
  };

  // index.html
  const indexTpl = read(path.join(TEMPLATES_DIR, "index.html"));

  write(path.join(outDir, "index.html"), applyTemplate(indexTpl, context));

  // docs.html
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

console.log("\n✅ Build finished successfully!");
console.log(`➡ Output in ${DIST}`);
