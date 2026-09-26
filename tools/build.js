import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

// ===== FIX __dirname EM ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIG =====
const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const DIST = path.join(ROOT, "dist");

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
copyRecursive(
  path.join(DOCS, "page"),
  path.join(DIST, "page")
);

copyRecursive(
  // Keep a root 404.html because vercel.json rewrites /404 -> /404.html
  path.join(DOCS, "page", "404.html"),
  path.join(DIST, "404.html")
);

copyRecursive(
  path.join(ASSETS_DIR, "index.html"),
  path.join(DIST, "index.html")
);

copyRecursive(
  path.join(ASSETS_DIR, "docs"),
  path.join(DIST, "docs")
);


for (const lang of LANGS) {
  console.log(`🌍 Building language: ${lang}`);

  const outDir = path.join(DIST, lang);
  ensureDir(outDir);

  // UI texts
  const ui = JSON.parse(
    read(path.join(CONTENT_DIR, lang, "ui.json"))
  );

  // Markdown → HTML
  const terms = marked.parse(
    read(path.join(CONTENT_DIR, lang, "terms.md"))
  );

  const privacy = marked.parse(
    read(path.join(CONTENT_DIR, lang, "privacy.md"))
  );

  const examples = {
    en: {
      get_200: JSON.stringify({
        _id: "677471831533c77a3a55b2e0",
        name: "3/4 Sit-Up",
        force: "pull",
        level: "beginner",
        mechanic: "compound",
        equipment: "body only",
        primaryMuscles: ["abdominals"],
        secondaryMuscles: [],
        instructions: ["Lie down on the floor and secure your feet"],
        category: "strength",
        images: ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"],
        id: "3_4_Sit-Up"
      }, null, 2),
      get_400: JSON.stringify({ message: "Error fetching exercises.", error: "Operation failed while fetching exercises." }, null, 2),
      lang_200: JSON.stringify([{ _id: "677471841533c77a3a55b2e6", name: "Advanced Kettlebell Windmill", force: "push", level: "intermediate", mechanic: "isolation", equipment: "kettlebells", primaryMuscles: ["abdominals"], secondaryMuscles: ["glutes", "hamstrings", "shoulders"], instructions: ["Clean and press a kettlebell overhead with one arm."], category: "strength", images: ["Advanced_Kettlebell_Windmill/0.jpg", "Advanced_Kettlebell_Windmill/1.jpg"], id: "Advanced_Kettlebell_Windmill" }], null, 2),
      lang_400: JSON.stringify({ message: "Invalid language. Use 'en', 'pt' or 'es'." }, null, 2),
      fields_200: JSON.stringify({ _id: "677471841533c77a3a55b2e9", name: "Alternate Hammer Curl", instructions: ["Stand up with your torso upright and a dumbbell in each hand.", "The palms of the hands should be facing your torso."] }, null, 2),
      fields_400: JSON.stringify({ message: "The field(s) parameter(s) cannot be empty. Valid fields are: force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, category, images, name." }, null, 2),
      page_200: JSON.stringify({ _id: "677471841533c77a55b4d4", name: "One-Arm Open Palm Kettlebell Clean", force: "pull", level: "intermediate", mechanic: "compound", equipment: "kettlebells", primaryMuscles: ["hamstrings"], secondaryMuscles: ["forearms", "glutes", "lower back", "quadriceps", "shoulders"], instructions: ["Place one kettlebell between your feet."], category: "strength", images: ["One-Arm_Open_Palm_Kettlebell_Clean/0.jpg", "One-Arm_Open_Palm_Kettlebell_Clean/1.jpg"], id: "One-Arm_Open_Palm_Kettlebell_Clean", __v: 0 }, null, 2),
      page_400: JSON.stringify({ message: "parameter 'page' is invalid. use a value greater than or equal to 0." }, null, 2),
      limit_200: JSON.stringify([{ _id: "677471841533c77a3a55b4c1", name: "Bent-Over Two-Arm Long Bar Row", force: "pull" }], null, 2),
      limit_400: JSON.stringify({ message: "parameter 'limit' must be greater than 0" }, null, 2),
      filters_200: JSON.stringify([{ _id: "677471841533c77a3a55b4ff", name: "Plyo Kettlebell Pushups", force: "push", level: "expert", mechanic: "compound", equipment: "kettlebells", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"], instructions: ["Place a kettlebell on the floor. Place yourself in a pushup position."], category: "strength", images: ["Plyo_Kettlebell_Pushups/0.jpg", "Plyo_Kettlebell_Pushups/1.jpg"], id: "Plyo_Kettlebell_Pushups", __v: 0 }], null, 2),
      filters_400: JSON.stringify({ message: "No exercises found." }, null, 2),
      search_200: JSON.stringify({ exercises: [{ _id: "677471831533c77a3a55b2e0", name: "3/4 Sit-Up", force: "pull", level: "beginner", mechanic: "compound", equipment: "body only", primaryMuscles: ["abdominals"], secondaryMuscles: [], instructions: ["Lie down on the floor and secure your feet"], category: "strength", images: ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"], id: "3_4_Sit-Up" }] }, null, 2),
      search_400: JSON.stringify({ message: "Please provide a search term." }, null, 2),
      image_404: JSON.stringify({ message: "The $exerciseName provided is incorrect or does not exist in the database. Try:", availableOptions: ["Stiff-Legged_Barbell_Deadlift"] }, null, 2)
    },
    pt: {
      get_200: JSON.stringify({ _id: "677471831533c77a3a55b2e0", name: "Abdominal 3/4", force: "puxar", level: "iniciante", mechanic: "composto", equipment: "peso corporal", primaryMuscles: ["abdominais"], secondaryMuscles: [], instructions: ["Deite-se no chão e prenda os pés."], category: "força", images: ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"], id: "3_4_Sit-Up" }, null, 2),
      get_400: JSON.stringify({ message: "Erro ao buscar os exercícios.", error: "Falha ao buscar exercícios." }, null, 2),
      lang_200: JSON.stringify([{ _id: "677471841533c77a3a55b2e6", name: "Moinho Avançado com Kettlebell", force: "empurrar", level: "intermediário", mechanic: "isolamento", equipment: "kettlebells", primaryMuscles: ["abdominais"], secondaryMuscles: ["glúteos", "posteriores de coxa", "ombros"], instructions: ["Faça a limpeza e pressione um kettlebell acima da cabeça com um braço."], category: "força", images: ["Advanced_Kettlebell_Windmill/0.jpg", "Advanced_Kettlebell_Windmill/1.jpg"], id: "Advanced_Kettlebell_Windmill" }], null, 2),
      lang_400: JSON.stringify({ message: "Idioma inválido. Use 'en', 'pt' ou 'es'." }, null, 2),
      fields_200: JSON.stringify({ _id: "677471841533c77a3a55b2e9", name: "Rosca Martelo Alternada", instructions: ["Fique em pé com o tronco ereto e um haltere em cada mão.", "As palmas das mãos devem estar voltadas para o tronco."] }, null, 2),
      fields_400: JSON.stringify({ message: "O(s) parâmetro(s) de campo(s) não pode(m) estar vazio(s). Campos válidos são: force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, category, images, name." }, null, 2),
      page_200: JSON.stringify({ _id: "677471841533c77a3a55b4d4", name: "Clean com Kettlebell de Uma Mão e Palma Aberta", force: "puxar", level: "intermediário", mechanic: "composto", equipment: "kettlebells", primaryMuscles: ["posteriores de coxa"], secondaryMuscles: ["antebraços", "glúteos", "lombar", "quadríceps", "ombros"], instructions: ["Coloque um kettlebell entre os pés."], category: "força", images: ["One-Arm_Open_Palm_Kettlebell_Clean/0.jpg", "One-Arm_Open_Palm_Kettlebell_Clean/1.jpg"], id: "One-Arm_Open_Palm_Kettlebell_Clean", __v: 0 }, null, 2),
      page_400: JSON.stringify({ message: "Parâmetro 'page' inválido. use um valor maior ou igual a 0." }, null, 2),
      limit_200: JSON.stringify([{ _id: "677471841533c77a3a55b4c1", name: "Remada Curvada com Barra Longa e Dois Braços", force: "puxar" }], null, 2),
      limit_400: JSON.stringify({ message: "Parâmetro 'limit' deve ser maior que 0" }, null, 2),
      filters_200: JSON.stringify([{ _id: "677471841533c77a3a55b4ff", name: "Flexões Pliométricas com Kettlebell", force: "empurrar", level: "expert", mechanic: "composto", equipment: "kettlebells", primaryMuscles: ["peito"], secondaryMuscles: ["ombros", "tríceps"], instructions: ["Coloque um kettlebell no chão e fique na posição de flexão."], category: "força", images: ["Plyo_Kettlebell_Pushups/0.jpg", "Plyo_Kettlebell_Pushups/1.jpg"], id: "Plyo_Kettlebell_Pushups", __v: 0 }], null, 2),
      filters_400: JSON.stringify({ message: "Nenhum exercício encontrado." }, null, 2),
      search_200: JSON.stringify({ exercises: [{ _id: "677471831533c77a3a55b2e0", name: "Abdominal 3/4", force: "puxar", level: "iniciante", mechanic: "composto", equipment: "peso corporal", primaryMuscles: ["abdominais"], secondaryMuscles: [], instructions: ["Deite-se no chão e prenda os pés."], category: "força", images: ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"], id: "3_4_Sit-Up" }] }, null, 2),
      search_400: JSON.stringify({ message: "Por favor, insira um termo de pesquisa." }, null, 2),
      image_404: JSON.stringify({ message: "O $exerciseName inserido está incorreto ou não existe no banco de dados. Tente:", availableOptions: ["Stiff-Legged_Barbell_Deadlift"] }, null, 2)
    },
    es: {
      get_200: JSON.stringify({ _id: "677471831533c77a3a55b2e0", name: "Abdominal 3/4", force: "tirar", level: "principiante", mechanic: "compuesto", equipment: "peso corporal", primaryMuscles: ["abdominales"], secondaryMuscles: [], instructions: ["Acuéstese en el suelo y asegure los pies."], category: "fuerza", images: ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"], id: "3_4_Sit-Up" }, null, 2),
      get_400: JSON.stringify({ message: "Error al obtener los ejercicios.", error: "Error al obtener los ejercicios." }, null, 2),
      lang_200: JSON.stringify([{ _id: "677471841533c77a3a55b2e6", name: "Molino avanzado con pesa rusa", force: "empuje", level: "intermedio", mechanic: "aislamiento", equipment: "pesas rusas", primaryMuscles: ["abdominales"], secondaryMuscles: ["glúteos", "isquiotibiales", "hombros"], instructions: ["Limpie y presione una pesa rusa por encima de la cabeza con un brazo."], category: "fuerza", images: ["Advanced_Kettlebell_Windmill/0.jpg", "Advanced_Kettlebell_Windmill/1.jpg"], id: "Advanced_Kettlebell_Windmill" }], null, 2),
      lang_400: JSON.stringify({ message: "Idioma no válido. Use 'en', 'pt' o 'es'." }, null, 2),
      fields_200: JSON.stringify({ _id: "677471841533c77a3a55b2e9", name: "Curl de Martillo Alternado", instructions: ["Póngase de pie con el torso erguido y una mancuerna en cada mano.", "Las palmas de las manos deben estar orientadas hacia el torso."] }, null, 2),
      fields_400: JSON.stringify({ message: "El/los parámetro(s) de campo(s) no puede(n) estar vacío(s). Los campos válidos son: force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, category, images, name." }, null, 2),
      page_200: JSON.stringify({ _id: "677471841533c77a3a55b4d4", name: "Clean con kettlebell a una mano y palma abierta", force: "tirar", level: "intermedio", mechanic: "compuesto", equipment: "pesas rusas", primaryMuscles: ["isquiotibiales"], secondaryMuscles: ["antebrazos", "glúteos", "zona lumbar", "cuádriceps", "hombros"], instructions: ["Coloque una pesa rusa entre los pies."], category: "fuerza", images: ["One-Arm_Open_Palm_Kettlebell_Clean/0.jpg", "One-Arm_Open_Palm_Kettlebell_Clean/1.jpg"], id: "One-Arm_Open_Palm_Kettlebell_Clean", __v: 0 }, null, 2),
      page_400: JSON.stringify({ message: "El parámetro 'page' no es válido. use un valor mayor o igual a 0." }, null, 2),
      limit_200: JSON.stringify([{ _id: "677471841533c77a3a55b4c1", name: "Remo inclinado con barra larga a dos brazos", force: "tirar" }], null, 2),
      limit_400: JSON.stringify({ message: "El parámetro 'limit' debe ser mayor que 0" }, null, 2),
      filters_200: JSON.stringify([{ _id: "677471831533c77a3a55b4ff", name: "Flexiones pliométricas con pesa rusa", force: "empuje", level: "experto", mechanic: "compuesto", equipment: "pesas rusas", primaryMuscles: ["pecho"], secondaryMuscles: ["hombros", "tríceps"], instructions: ["Coloque una pesa rusa en el suelo y adopte la posición de flexión."], category: "fuerza", images: ["Plyo_Kettlebell_Pushups/0.jpg", "Plyo_Kettlebell_Pushups/1.jpg"], id: "Plyo_Kettlebell_Pushups", __v: 0 }], null, 2),
      filters_400: JSON.stringify({ message: "No se encontraron ejercicios." }, null, 2),
      search_200: JSON.stringify({ exercises: [{ _id: "677471831533c77a3a55b2e0", name: "Abdominal 3/4", force: "tirar", level: "principiante", mechanic: "compuesto", equipment: "peso corporal", primaryMuscles: ["abdominales"], secondaryMuscles: [], instructions: ["Acuéstese en el suelo y asegure los pies."], category: "fuerza", images: ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"], id: "3_4_Sit-Up" }] }, null, 2),
      search_400: JSON.stringify({ message: "Por favor, introduzca un término de búsqueda." }, null, 2),
      image_404: JSON.stringify({ message: "El $exerciseName proporcionado es incorrecto o no existe en la base de datos. Pruebe:", availableOptions: ["Stiff-Legged_Barbell_Deadlift"] }, null, 2)
    }
  };

  const context = {
    lang,
    ui,
    ...Object.fromEntries(Object.entries(examples[lang]).map(([key, value]) => [`example_${key}`, value])),
    terms,
    privacy,
    github_url: "https://github.com/MuscleLib",
    issues_url: "https://github.com/MuscleLib/MuscleLibAPI/issues",
    stats: {
      exercises: "800+",
      images: "1700+"
    }
  };

  // index.html
  const indexTpl = read(
    path.join(TEMPLATES_DIR, "index.html")
  );

  write(
    path.join(outDir, "index.html"),
    applyTemplate(indexTpl, context)
  );

  // docs.html
  const docsTpl = read(
    path.join(TEMPLATES_DIR, "docs.html")
  );

  write(
    path.join(outDir, "docs.html"),
    applyTemplate(docsTpl, context)
  );
}

console.log("\n✅ Build finished successfully!");
console.log("➡ Output in /dist");
