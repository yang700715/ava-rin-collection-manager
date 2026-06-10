const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const appFile = path.join(projectRoot, "src", "App.jsx");

function backupFile(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${file}.bak-v0-6e-${stamp}`;
  fs.copyFileSync(file, backupPath);
  return backupPath;
}

try {
  if (!fs.existsSync(appFile)) {
    throw new Error(`找不到檔案：${appFile}`);
  }

  let content = fs.readFileSync(appFile, "utf8");
  const backup = backupFile(appFile);

  const oldBlock = `  const isAdmin =
    new URLSearchParams(window.location.search).get("admin") === "1";`;

  const newBlock = `  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const isAdmin =
    isLocalhost &&
    new URLSearchParams(window.location.search).get("admin") === "1";`;

  if (content.includes(newBlock)) {
    console.log("✅ 已經是 v0.6e 狀態：線上版不會啟動管理模式。");
    console.log(`備份檔案：${backup}`);
    process.exit(0);
  }

  if (!content.includes(oldBlock)) {
    throw new Error("找不到 isAdmin 判斷區塊，無法自動修改。");
  }

  content = content.replace(oldBlock, newBlock);

  content = content.replaceAll("Local Admin v0.6d", "Local Admin v0.6e");
  content = content.replaceAll("Gallery Mode v0.6d", "Gallery Mode v0.6e");
  content = content.replaceAll("Local Admin v0.6", "Local Admin v0.6e");
  content = content.replaceAll("Gallery Mode v0.6", "Gallery Mode v0.6e");

  fs.writeFileSync(appFile, content, "utf8");

  console.log("✅ 完成：線上 Vercel 版已禁止啟動 admin 模式。");
  console.log(`備份檔案：${backup}`);
  console.log("");
  console.log("效果：");
  console.log("- localhost:5173/?admin=1 仍可管理");
  console.log("- Vercel 網址 ?admin=1 會當成展示頁，不再跳 API 錯誤");
  console.log("");
  console.log("下一步：");
  console.log("1. Ctrl + C 停掉目前 npm run dev");
  console.log("2. npm run dev");
  console.log("3. 本機測試 http://localhost:5173/?admin=1");
  console.log("4. npm run build");
  console.log("5. git add src\\App.jsx");
  console.log("6. git commit -m \"Limit admin mode to localhost\"");
  console.log("7. git push");
} catch (error) {
  console.error("");
  console.error("❌ v0.6e 套用失敗：");
  console.error(error.message);
  console.error("");
  console.error("原檔已先備份；請把這段錯誤截圖貼回來。");
  process.exit(1);
}
