const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

const imageFolder = path.join(
  projectRoot,
  "public",
  "images",
  "line-stickers",
  "ava-rin-work-1"
);

const outputFolder = path.join(projectRoot, "src", "data");
const outputFile = path.join(outputFolder, "seedData.js");

const allowedExts = [".png", ".jpg", ".jpeg", ".webp"];

function titleFromFileName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, " ")
    .trim();
}

if (!fs.existsSync(imageFolder)) {
  console.error("找不到圖片資料夾：");
  console.error(imageFolder);
  process.exit(1);
}

const files = fs
  .readdirSync(imageFolder)
  .filter((file) => allowedExts.includes(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "zh-Hant"));

const items = files.map((file, index) => {
  const title = titleFromFileName(file);

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
});

const seedData = {
  categories: [
    {
      id: "cat-line",
      name: "LINE 貼圖",
      description: "Ava_凜 LINE 貼圖系列，依照系列整理單張貼圖。",
    },
  ],
  series: [
    {
      id: "series-work-1",
      categoryId: "cat-line",
      name: "Ava_凜 工作篇 1",
      description:
        "工作情境貼圖，包含加班中、開工啦、收到、馬上處理、會議中、下班啦。",
    },
  ],
  items,
};

const fileContent = `const seedData = ${JSON.stringify(seedData, null, 2)};

export default seedData;
`;

fs.mkdirSync(outputFolder, { recursive: true });
fs.writeFileSync(outputFile, fileContent, "utf8");

console.log("完成產生 seedData.js");
console.log(`圖片數量：${files.length}`);
console.log(`輸出檔案：${outputFile}`);

if (files.length === 0) {
  console.log("提醒：圖片資料夾目前沒有 png/jpg/jpeg/webp 圖片。");
}