import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const policies = {
  en: { required: ["localStorage", "theme", "activeLink", "not cookies", "jsDelivr", "Vercel Blob"], forbidden: ["Cookies are used only to store", "No data is shared with third parties"] },
  pt: { required: ["localStorage", "theme", "activeLink", "não são cookies", "jsDelivr", "Vercel Blob"], forbidden: ["Os cookies são utilizados exclusivamente para armazenar", "Nenhuma informação é compartilhada com terceiros"] },
  es: { required: ["localStorage", "theme", "activeLink", "no son cookies", "jsDelivr", "Vercel Blob"], forbidden: ["Las cookies se utilizan únicamente para almacenar", "No se comparten datos con terceros"] },
};

for (const [lang, checks] of Object.entries(policies)) {
  const sourcePath = path.join(root, "docs", "content", lang, "privacy.md");
  const outputPath = path.join(root, "dist", lang, "privacy.html");
  if (!fs.existsSync(sourcePath) || !fs.existsSync(outputPath)) throw new Error("Missing privacy policy source or generated page: " + lang);
  const source = fs.readFileSync(sourcePath, "utf8");
  const output = fs.readFileSync(outputPath, "utf8");
  for (const phrase of checks.required) {
    if (!source.includes(phrase) || !output.includes(phrase)) throw new Error("Privacy policy validation failed for " + lang + ": missing " + phrase);
  }
  for (const phrase of checks.forbidden) {
    if (source.includes(phrase) || output.includes(phrase)) throw new Error("Privacy policy validation failed for " + lang + ": outdated claim " + phrase);
  }
}
console.log("Privacy policies validated for en, pt, and es.");
