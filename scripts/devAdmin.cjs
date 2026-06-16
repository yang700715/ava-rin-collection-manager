const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const projectRoot = process.cwd();
const port = 5174;

const dataFolder = path.join(projectRoot, "src", "data");
const sourceFile = path.join(dataFolder, "sourceData.json");
const seedFile = path.join(dataFolder, "seedData.js");
const publicImagesRoot = path.join(projectRoot, "public", "images");

const allowedExts = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function sanitizeName(name, fallback = "untitled") {
  const safe = String(name || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return safe || fallback;
}

function fileTitle(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .trim();
}

function uniqueName(folder, baseName, ext = "") {
  const cleanBase = sanitizeName(baseName, "untitled");
  let name = `${cleanBase}${ext}`;
  let count = 2;

  while (fs.existsSync(path.join(folder, name))) {
    name = `${cleanBase}-${count}${ext}`;
    count += 1;
  }

  return name;
}

function fallbackSourceData() {
  const fallbackFolder = path.join(
    publicImagesRoot,
    "line-stickers",
    "ava-rin-work-1"
  );

  ensureDir(fallbackFolder);

  const files = fs
    .readdirSync(fallbackFolder)
    .filter((file) => allowedExts.includes(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));

  return {
    categories: [
      {
        id: "cat-line",
        name: "LINE 貼圖",
        slug: "line-stickers",
        description: "Ava_凜 LINE 貼圖系列，依照系列整理單張貼圖。",
      },
    ],
    series: [
      {
        id: "series-work-1",
        categoryId: "cat-line",
        name: "Ava_凜 工作篇 1",
        slug: "ava-rin-work-1",
        description:
          "工作情境貼圖，包含加班中、開工啦、收到、馬上處理、會議中、下班啦。",
      },
    ],
    items: files.map((file, index) => {
      const title = fileTitle(file);

      return {
        id: `ava-rin-work-1-${String(index + 1).padStart(3, "0")}`,
        categoryId: "cat-line",
        seriesId: "series-work-1",
        title,
        displayText: title,
        status: "完成",
        image: `/images/line-stickers/ava-rin-work-1/${file}`,
        notes: "Ava_凜 工作篇 1。",
      };
    }),
  };
}

function loadData() {
  ensureDir(dataFolder);
  ensureDir(publicImagesRoot);

  if (!fs.existsSync(sourceFile)) {
    const data = fallbackSourceData();
    saveData(data);
    return data;
  }

  return JSON.parse(fs.readFileSync(sourceFile, "utf8"));
}

function saveData(data) {
  ensureDir(dataFolder);

  fs.writeFileSync(sourceFile, JSON.stringify(data, null, 2), "utf8");

  const seedContent = `const seedData = ${JSON.stringify(data, null, 2)};

export default seedData;
`;

  fs.writeFileSync(seedFile, seedContent, "utf8");
}

function getCategory(data, id) {
  return data.categories.find((category) => category.id === id);
}

function getSeries(data, id) {
  return data.series.find((series) => series.id === id);
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl).match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    throw new Error("圖片格式不正確。");
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");

  return { mime, buffer };
}

function extFromMime(mime, originalName = "") {
  const originalExt = path.extname(originalName).toLowerCase();

  if (allowedExts.includes(originalExt)) {
    return originalExt;
  }

  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("gif")) return ".gif";

  return ".png";
}

function imagePathToDisk(imagePath) {
  if (!imagePath || !imagePath.startsWith("/images/")) {
    return null;
  }

  const relative = imagePath.replace(/^\/images\//, "");
  return path.join(publicImagesRoot, relative);
}

function deleteImageFile(imagePath) {
  const diskPath = imagePathToDisk(imagePath);

  if (!diskPath) return;
  if (!diskPath.startsWith(publicImagesRoot)) return;

  if (fs.existsSync(diskPath)) {
    fs.unlinkSync(diskPath);
  }
}

function safeRemoveDir(folderPath) {
  const root = path.resolve(publicImagesRoot);
  const target = path.resolve(folderPath);

  if (target === root || !target.startsWith(root + path.sep)) {
    throw new Error("刪除路徑不安全，已停止。");
  }

  fs.rmSync(target, {
    recursive: true,
    force: true,
  });
}

function categoryFolderPath(category) {
  return path.join(publicImagesRoot, category.slug);
}

function seriesFolderPath(category, series) {
  return path.join(publicImagesRoot, category.slug, series.slug);
}

function writeUploadedImage({ data, categoryId, seriesId, title, file }) {
  const category = getCategory(data, categoryId);
  const series = getSeries(data, seriesId);

  if (!category) throw new Error("找不到主分類。");
  if (!series) throw new Error("找不到系列。");

  const folder = path.join(publicImagesRoot, category.slug, series.slug);
  ensureDir(folder);

  const { mime, buffer } = dataUrlToBuffer(file.dataUrl);
  const ext = extFromMime(mime, file.name);

  const base = title || fileTitle(file.name) || "untitled";
  const fileName = uniqueName(folder, base, ext);

  const diskPath = path.join(folder, fileName);
  fs.writeFileSync(diskPath, buffer);

  return `/images/${category.slug}/${series.slug}/${fileName}`;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    const limit = 250 * 1024 * 1024;

    req.on("data", (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body) > limit) {
        reject(new Error("資料太大。"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON 格式錯誤。"));
      }
    });
  });
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, `http://localhost:${port}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/admin-data") {
      const data = loadData();
      sendJson(res, 200, data);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/categories") {
      const body = await readBody(req);
      const data = loadData();

      const name = String(body.name || "").trim();
      if (!name) throw new Error("請輸入主分類名稱。");

      const slug = uniqueName(publicImagesRoot, sanitizeName(body.slug || name));
      const folder = path.join(publicImagesRoot, slug);
      ensureDir(folder);

      const category = {
        id: uid("cat"),
        name,
        slug,
        description: String(body.description || "").trim(),
      };

      data.categories.push(category);
      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/series") {
      const body = await readBody(req);
      const data = loadData();

      const category = getCategory(data, body.categoryId);
      if (!category) throw new Error("找不到主分類。");

      const name = String(body.name || "").trim();
      if (!name) throw new Error("請輸入系列名稱。");

      const categoryFolder = path.join(publicImagesRoot, category.slug);
      ensureDir(categoryFolder);

      const slug = uniqueName(categoryFolder, sanitizeName(body.slug || name));
      ensureDir(path.join(categoryFolder, slug));

      const series = {
        id: uid("series"),
        categoryId: category.id,
        name,
        slug,
        description: String(body.description || "").trim(),
      };

      data.series.push(series);
      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/categories/")) {
      const id = decodeURIComponent(
        url.pathname.replace("/api/categories/", "")
      );

      const data = loadData();
      const category = getCategory(data, id);

      if (!category) {
        throw new Error("找不到要刪除的主分類。");
      }

      const relatedSeriesIds = new Set(
        data.series
          .filter((series) => series.categoryId === id)
          .map((series) => series.id)
      );

      safeRemoveDir(categoryFolderPath(category));

      data.categories = data.categories.filter(
        (entry) => entry.id !== category.id
      );

      data.series = data.series.filter(
        (entry) => entry.categoryId !== category.id
      );

      data.items = data.items.filter(
        (entry) =>
          entry.categoryId !== category.id &&
          !relatedSeriesIds.has(entry.seriesId)
      );

      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/series/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/series/", ""));

      const data = loadData();
      const series = getSeries(data, id);

      if (!series) {
        throw new Error("找不到要刪除的系列。");
      }

      const category = getCategory(data, series.categoryId);

      if (category) {
        // v0.6c 安全修正：
        // 刪除系列時只刪除「系列資料夾」，並且重新確保主分類資料夾存在。
        const targetSeriesFolder = seriesFolderPath(category, series);
        safeRemoveDir(targetSeriesFolder);
        ensureDir(categoryFolderPath(category));
      }

      // 嚴格只刪系列與該系列底下作品，不碰 data.categories。
      data.series = data.series.filter((entry) => entry.id !== series.id);
      data.items = data.items.filter((entry) => entry.seriesId !== series.id);

      // 防呆：就算舊版資料流程不小心讓分類消失，也把原分類補回。
      if (category && !data.categories.some((entry) => entry.id === category.id)) {
        data.categories.push(category);
      }

      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/items") {
      const body = await readBody(req);
      const data = loadData();

      const categoryId = body.categoryId;
      const seriesId = body.seriesId;
      const files = Array.isArray(body.files) ? body.files : [];
      const baseTitle = String(body.baseTitle || "").trim();
      const displayText = String(body.displayText || "").trim();
      const status = String(body.status || "完成").trim();
      const notes = String(body.notes || "").trim();

      if (!getCategory(data, categoryId)) throw new Error("找不到主分類。");
      if (!getSeries(data, seriesId)) throw new Error("找不到系列。");

      const newItems = [];

      if (files.length > 0) {
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const fileNameTitle = fileTitle(file.name);
          const number = String(index + 1).padStart(2, "0");

          let title = "";
          if (files.length === 1) {
            title = baseTitle || fileNameTitle;
          } else {
            title = baseTitle ? `${baseTitle} ${number}` : fileNameTitle;
          }

          const image = writeUploadedImage({
            data,
            categoryId,
            seriesId,
            title,
            file,
          });

          newItems.push({
            id: uid("item"),
            categoryId,
            seriesId,
            title,
            displayText: displayText || title,
            status,
            image,
            notes,
          });
        }
      } else {
        const title = baseTitle;
        if (!title) throw new Error("請輸入作品名稱或選擇圖片。");

        newItems.push({
          id: uid("item"),
          categoryId,
          seriesId,
          title,
          displayText: displayText || title,
          status,
          image: "",
          notes,
        });
      }

      data.items.unshift(...newItems);
      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "PUT" && url.pathname.startsWith("/api/items/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/items/", ""));
      const body = await readBody(req);
      const data = loadData();

      const item = data.items.find((entry) => entry.id === id);
      if (!item) throw new Error("找不到作品。");

      const series = getSeries(data, body.seriesId);
      if (!series) throw new Error("找不到系列。");

      const title = String(body.title || "").trim();
      if (!title) throw new Error("作品名稱不能空白。");

      let image = item.image;

      if (body.file && body.file.dataUrl) {
        deleteImageFile(item.image);

        image = writeUploadedImage({
          data,
          categoryId: series.categoryId,
          seriesId: series.id,
          title,
          file: body.file,
        });
      }

      const updatedItem = {
        ...item,
        categoryId: series.categoryId,
        seriesId: series.id,
        title,
        displayText: String(body.displayText || "").trim() || title,
        status: String(body.status || "完成").trim(),
        image,
        notes: String(body.notes || "").trim(),
      };

      data.items = data.items.map((entry) =>
        entry.id === id ? updatedItem : entry
      );

      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/items/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/items/", ""));
      const data = loadData();

      const item = data.items.find((entry) => entry.id === id);
      if (item) {
        deleteImageFile(item.image);
      }

      data.items = data.items.filter((entry) => entry.id !== id);
      saveData(data);

      sendJson(res, 200, data);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/import-data") {
      const body = await readBody(req);

      if (
        !Array.isArray(body.categories) ||
        !Array.isArray(body.series) ||
        !Array.isArray(body.items)
      ) {
        throw new Error("匯入 JSON 格式不正確。");
      }

      saveData(body);
      sendJson(res, 200, body);
      return;
    }

    sendJson(res, 404, { error: "找不到 API。" });
  } catch (error) {
    console.error(error);
    sendJson(res, 400, { error: error.message || "API 發生錯誤。" });
  }
}

loadData();

const server = http.createServer(handleApi);

server.listen(port, () => {
  console.log(`本機寫檔 API 已啟動：http://localhost:${port}`);
  console.log("即將啟動 Vite：http://localhost:5173");
});

const vite = spawn("npm", ["run", "dev:vite", "--", "--configLoader", "runner"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

function shutdown() {
  vite.kill();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
