const escapeCsvValue = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const downloadTextFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportRowsAsCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  downloadTextFile(filename, csv, "text/csv;charset=utf-8");
};

export const exportJsonFile = (filename, data) => {
  downloadTextFile(
    filename,
    JSON.stringify(data, null, 2),
    "application/json;charset=utf-8"
  );
};

export const exportHistoryAsJson = (history) => {
  exportJsonFile(`xiaoxiaoyuan-draw-history-${Date.now()}.json`, history);
};

export const exportHistoryAsCsv = (history) => {
  exportRowsAsCsv(`xiaoxiaoyuan-draw-history-${Date.now()}.csv`, [
    ["時間", "獎項名稱", "獎項等級", "是否大獎"],
    ...history.map((record) => [
      new Date(record.drawnAt).toLocaleString("zh-TW"),
      record.prizeName,
      record.tier,
      record.isGrand ? "是" : "否",
    ]),
  ]);
};
