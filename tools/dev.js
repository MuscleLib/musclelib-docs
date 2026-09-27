import { spawn } from "node:child_process";
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, ".dev-dist");
const WATCH_ROOTS = [path.join(ROOT, "docs"), path.join(ROOT, "tools")];
const PORT = Number(process.env.PORT || 4173);

const watchers = new Map();
const reloadClients = new Set();
let buildTimer;
let building = false;
let buildQueued = false;

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(ROOT, "tools", "build.js")],
      {
        cwd: ROOT,
        stdio: "inherit",
        env: { ...process.env, DIST_DIR: DIST },
      },
    );

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build finalizado com código ${code}.`));
    });
  });
}

function notifyReload() {
  for (const client of reloadClients) {
    client.write("event: reload\ndata: updated\n\n");
  }
}

async function rebuild() {
  if (building) {
    buildQueued = true;
    return;
  }

  building = true;
  try {
    console.log("\nAlterações detectadas. Atualizando a prévia...");
    await runBuild();
    notifyReload();
  } catch (error) {
    console.error(error);
  } finally {
    building = false;
    if (buildQueued) {
      buildQueued = false;
      scheduleBuild();
    }
  }
}

function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => void rebuild(), 250);
}

function watchDirectory(directory) {
  if (watchers.has(directory)) return;

  try {
    const watcher = fs.watch(directory, (_eventType, filename) => {
      if (filename) {
        const changedPath = path.join(directory, filename.toString());
        try {
          if (fs.statSync(changedPath).isDirectory())
            watchDirectory(changedPath);
        } catch {
          // The changed file may have been removed.
        }
      }
      scheduleBuild();
    });

    watcher.on("error", (error) =>
      console.error(`Erro ao observar ${directory}:`, error),
    );
    watchers.set(directory, watcher);

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) watchDirectory(path.join(directory, entry.name));
    }
  } catch (error) {
    console.error(`Não foi possível observar ${directory}:`, error);
  }
}

function resolveRoute(pathname) {
  if (pathname === "/") return "/en/index.html";
  if (pathname === "/docs") return "/en/docs.html";
  if (pathname === "/404") return "/404.html";

  const localeHome = pathname.match(/^\/(en|pt|es)\/?$/);
  if (localeHome) return `/${localeHome[1]}/index.html`;

  const localeDocs = pathname.match(/^\/(en|pt|es)\/docs\/?$/);
  if (localeDocs) return `/${localeDocs[1]}/docs.html`;

  const localeLegal = pathname.match(/^\/(en|pt|es)\/(terms|privacy)\/?$/);
  if (localeLegal) return `/${localeLegal[1]}/${localeLegal[2]}.html`;

  return pathname;
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (pathname === "/__dev/reload") {
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    });
    response.write("event: connected\ndata: ready\n\n");
    reloadClients.add(response);
    request.on("close", () => reloadClients.delete(response));
    return;
  }

  let route;
  try {
    route = resolveRoute(decodeURIComponent(pathname));
  } catch {
    route = "/404.html";
  }

  let filePath = path.resolve(DIST, `.${route}`);
  if (!filePath.startsWith(`${DIST}${path.sep}`))
    filePath = path.join(DIST, "404.html");

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.statusCode = 404;
      filePath = path.join(DIST, "404.html");
    }

    const sendFile = (target) => {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader(
        "Content-Type",
        contentTypes[path.extname(target)] || "application/octet-stream",
      );

      if (path.extname(target) === ".html") {
        let html = fs.readFileSync(target, "utf8");
        html = html.replace(
          "</body>",
          '<script>new EventSource("/__dev/reload").addEventListener("reload", () => location.reload());</script></body>',
        );
        response.end(html);
        return;
      }

      fs.createReadStream(target).pipe(response);
    };

    if (error || !stats.isFile()) {
      fs.access(filePath, (fallbackError) => {
        if (fallbackError) {
          response.end("Build output not found. Run npm run dev again.");
          return;
        }
        sendFile(filePath);
      });
      return;
    }

    sendFile(filePath);
  });
});

try {
  await runBuild();
} catch (error) {
  console.error(error);
  process.exit(1);
}

for (const directory of WATCH_ROOTS) watchDirectory(directory);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Prévia disponível em http://localhost:${PORT}`);
  console.log(
    "Salve um arquivo em docs/ para atualizar a página automaticamente.",
  );
});
