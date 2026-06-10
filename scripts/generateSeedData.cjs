const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

const dataFolder = path.join(projectRoot, "src", "data");
const sourceFile = path.join(dataFolder, "sourceData.json");
const seedFile = path.join(dataFolder, "seedData.js");

const publicImagesRoot = path.join(projectRoot, "public", "images");
const fallbackFolder = path.join(
  publicImagesRoot,
  "line-stickers",
  "ava-rin-work-1"
);

const allowedExts = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fileTitle(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .trim();
}

function buildDefaultSourceData() {
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

function loadSourceData() {
  ensureDir(dataFolder);

  if (!fs.existsSync(sourceFile)) {
    const data = buildDefaultSourceData();
    fs.writeFileSync(sourceFile, JSON.stringify(data, null, 2), "utf8");
    return data;
  }

  return JSON.parse(fs.readFileSync(sourceFile, "utf8"));
}

function writeSeedData(data) {
  ensureDir(dataFolder);

  const content = `const seedData = ${JSON.stringify(data, null, 2)};

export default seedData;
`;

  fs.writeFileSync(seedFile, content, "utf8");
}

const sourceData = loadSourceData();
writeSeedData(sourceData);

console.log("完成產生 seedData.js");
console.log(`分類數量：${sourceData.categories.length}`);
console.log(`系列數量：${sourceData.series.length}`);
console.log(`作品數量：${sourceData.items.length}`);
console.log(`輸出檔案：${seedFile}`);