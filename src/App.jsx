import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "avaRinCollectionManager.react.v0.1";

const defaultData = {
  categories: [
    {
      id: "cat-line",
      name: "LINE 貼圖",
      description: "Ava_凜 LINE 貼圖系列，依照系列整理單張貼圖。",
    },
    {
      id: "cat-goods",
      name: "周邊",
      description: "公仔、座布團、角色小卡、展示配件等周邊作品。",
    },
  ],
  series: [
    {
      id: "series-work-1",
      categoryId: "cat-line",
      name: "Ava_凜 工作篇 1",
      description: "工作情境貼圖，包含加班中、開工啦、收到、馬上處理、會議中、下班啦。",
    },
    {
      id: "series-daily-1",
      categoryId: "cat-line",
      name: "Ava_凜 日常生活篇 1",
      description: "日常聊天常用貼圖，包含哈囉、謝謝、晚安、收到、愛你喔。",
    },
    {
      id: "series-zodiac-1",
      categoryId: "cat-line",
      name: "Ava_凜 十二生肖篇 1",
      description: "生肖祝福貼圖，後續重點是讓每張風格差異更明顯。",
    },
  ],
  items: [
    {
      id: "item-sample-1",
      categoryId: "cat-line",
      seriesId: "series-work-1",
      title: "加班中",
      displayText: "加班中",
      status: "完成",
      image: "",
      notes: "先放範例資料。之後可以把真正的加班中圖片上傳進來。",
    },
  ],
};

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultData;
  } catch {
    return defaultData;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("儲存失敗：", error);
    alert("圖片太大或太多，瀏覽器 localStorage 存不下。建議先少量測試，之後我們再改成正式資料庫或圖片檔案管理。");
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 1000;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/webp", 0.85);
        resolve(compressed);
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function cleanFileName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "未命名作品";
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [selectedCategoryId, setSelectedCategoryId] = useState("cat-line");
  const [selectedSeriesId, setSelectedSeriesId] = useState("series-work-1");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [modal, setModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const selectedCategory = data.categories.find((c) => c.id === selectedCategoryId);
  const selectedSeries = data.series.find((s) => s.id === selectedSeriesId);

  const visibleItems = useMemo(() => {
    return data.items.filter((item) => {
      const matchCategory = !selectedCategoryId || item.categoryId === selectedCategoryId;
      const matchSeries = !selectedSeriesId || item.seriesId === selectedSeriesId;
      const matchStatus = statusFilter === "全部" || item.status === statusFilter;
      const keyword = `${item.title} ${item.displayText} ${item.notes}`.toLowerCase();
      const matchSearch = !search || keyword.includes(search.toLowerCase());
      return matchCategory && matchSeries && matchStatus && matchSearch;
    });
  }, [data.items, selectedCategoryId, selectedSeriesId, search, statusFilter]);

  function updateData(nextData) {
    setData(nextData);
  }

  function addCategory(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = {
      id: uid("cat"),
      name: form.get("name").trim(),
      description: form.get("description").trim(),
    };

    const nextData = {
      ...data,
      categories: [...data.categories, category],
    };

    updateData(nextData);
    setSelectedCategoryId(category.id);
    setSelectedSeriesId("");
    setModal(null);
  }

  function addSeries(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const series = {
      id: uid("series"),
      categoryId: form.get("categoryId"),
      name: form.get("name").trim(),
      description: form.get("description").trim(),
    };

    const nextData = {
      ...data,
      series: [...data.series, series],
    };

    updateData(nextData);
    setSelectedCategoryId(series.categoryId);
    setSelectedSeriesId(series.id);
    setModal(null);
  }

  async function addItems(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const imageInput = event.currentTarget.querySelector('input[name="image"]');
    const files = Array.from(imageInput?.files || []);
    const categoryId = form.get("categoryId");
    const seriesId = form.get("seriesId");
    const baseTitle = form.get("title").trim();
    const displayText = form.get("displayText").trim();
    const status = form.get("status");
    const notes = form.get("notes").trim();

    if (files.length === 0 && !baseTitle) {
      alert("請至少填作品名稱，或選一張圖片。");
      return;
    }

    const newItems = [];

    if (files.length > 0) {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const image = await fileToDataUrl(file);
        const fileName = cleanFileName(file.name);
        const number = String(i + 1).padStart(2, "0");

        let title = "";
        if (files.length === 1) {
          title = baseTitle || fileName;
        } else {
          title = baseTitle ? `${baseTitle} ${number}` : fileName;
        }

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
      newItems.push({
        id: uid("item"),
        categoryId,
        seriesId,
        title: baseTitle,
        displayText: displayText || baseTitle,
        status,
        image: "",
        notes,
      });
    }

    updateData({
      ...data,
      items: [...newItems, ...data.items],
    });

    setSelectedCategoryId(categoryId);
    setSelectedSeriesId(seriesId);
    setModal(null);

    if (newItems.length > 1) {
      alert(`已新增 ${newItems.length} 筆作品。`);
    }
  }

  function deleteItem(id) {
    const target = data.items.find((item) => item.id === id);
    if (!target) return;

    const ok = confirm(`確定刪除「${target.title}」嗎？`);
    if (!ok) return;

    updateData({
      ...data,
      items: data.items.filter((item) => item.id !== id),
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ava-rin-collection-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!Array.isArray(imported.categories) || !Array.isArray(imported.series) || !Array.isArray(imported.items)) {
        alert("JSON 格式不正確。");
        return;
      }

      updateData(imported);
      setSelectedCategoryId(imported.categories[0]?.id || "");
      setSelectedSeriesId(imported.series[0]?.id || "");
      alert("匯入完成。");
    } catch {
      alert("匯入失敗，請確認檔案。");
    }

    event.target.value = "";
  }

  function resetDemo() {
    const ok = confirm("確定重置成範例資料嗎？目前資料會被覆蓋。");
    if (!ok) return;

    updateData(defaultData);
    setSelectedCategoryId("cat-line");
    setSelectedSeriesId("series-work-1");
  }

  function clearAll() {
    const ok = confirm("確定清空全部資料嗎？建議先匯出 JSON 備份。");
    if (!ok) return;

    updateData({
      categories: [],
      series: [],
      items: [],
    });
    setSelectedCategoryId("");
    setSelectedSeriesId("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">凜</div>
          <div>
            <h1>Ava_凜 作品庫</h1>
            <p>React Manager v0.1</p>
          </div>
        </div>

        <div className="sideActions">
          <button onClick={() => setModal("category")}>＋ 新增主分類</button>
          <button onClick={exportJson} className="ghost">匯出 JSON</button>
          <label className="ghost fileLabel">
            匯入 JSON
            <input type="file" accept="application/json" onChange={importJson} />
          </label>
        </div>

        <nav className="tree">
          {data.categories.map((category) => {
            const categoryItems = data.items.filter((item) => item.categoryId === category.id);
            const childSeries = data.series.filter((series) => series.categoryId === category.id);

            return (
              <div className="treeGroup" key={category.id}>
                <button
                  className={selectedCategoryId === category.id && !selectedSeriesId ? "active" : ""}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setSelectedSeriesId("");
                  }}
                >
                  <span>{category.name}</span>
                  <em>{categoryItems.length}</em>
                </button>

                {childSeries.map((series) => {
                  const count = data.items.filter((item) => item.seriesId === series.id).length;
                  return (
                    <button
                      key={series.id}
                      className={`seriesBtn ${selectedSeriesId === series.id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setSelectedSeriesId(series.id);
                      }}
                    >
                      <span>› {series.name}</span>
                      <em>{count}</em>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="note">
          <strong>目前資料存在瀏覽器</strong>
          <p>換電腦或清除瀏覽器前，記得先匯出 JSON。</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Editable Website Prototype</p>
            <h2>分類 ＞ 系列 ＞ 貼圖作品</h2>
          </div>
          <div className="topActions">
            <button className="ghost" onClick={resetDemo}>重置範例</button>
            <button className="danger" onClick={clearAll}>清空資料</button>
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="breadcrumb">
              {selectedCategory?.name || "全部分類"} ＞ {selectedSeries?.name || "全部系列"} ＞ 貼圖
            </p>
            <h3>{selectedSeries?.name || selectedCategory?.name || "全部作品"}</h3>
            <p>{selectedSeries?.description || selectedCategory?.description || "請先新增分類、系列與作品。"}</p>
          </div>
          <div className="quickActions">
            <button onClick={() => setModal("series")}>＋ 新增系列</button>
            <button onClick={() => setModal("item")}>＋ 新增貼圖</button>
          </div>
        </section>

        <section className="toolbar">
          <input
            type="search"
            placeholder="搜尋貼圖名稱、文字、備註，例如：加班中、工作篇、Ava"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>全部</option>
            <option>完成</option>
            <option>草稿</option>
            <option>待修正</option>
            <option>暫停</option>
          </select>
        </section>

        <section className="grid">
          {visibleItems.length === 0 ? (
            <div className="emptyCard">
              <h4>目前沒有作品</h4>
              <p>點右上角「＋ 新增貼圖」，可以一次選多張圖片。</p>
            </div>
          ) : (
            visibleItems.map((item) => (
              <article className="card" key={item.id}>
                <div className="imageBox">
                  {item.image ? <img src={item.image} alt={item.title} /> : <div className="placeholder">凜</div>}
                </div>
                <div className="cardBody">
                  <div className="badges">
                    <span className={`badge ${item.status}`}>{item.status}</span>
                    {item.displayText && <span className="badge light">{item.displayText}</span>}
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.notes || "尚未填寫備註。"}</p>
                  <div className="cardActions">
                    <button className="ghost small" onClick={() => setDetailItem(item)}>查看</button>
                    <button className="danger small" onClick={() => deleteItem(item.id)}>刪除</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {modal === "category" && (
        <Modal title="新增主分類" onClose={() => setModal(null)}>
          <form onSubmit={addCategory}>
            <label>
              主分類名稱
              <input name="name" required placeholder="例如：LINE 貼圖、周邊、公仔" />
            </label>
            <label>
              說明
              <textarea name="description" rows="3" placeholder="這個分類要放什麼作品？" />
            </label>
            <ModalFooter onClose={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {modal === "series" && (
        <Modal title="新增系列" onClose={() => setModal(null)}>
          <form onSubmit={addSeries}>
            <label>
              所屬主分類
              <select name="categoryId" defaultValue={selectedCategoryId}>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              系列名稱
              <input name="name" required placeholder="例如：Ava_凜 工作篇 1" />
            </label>
            <label>
              系列說明
              <textarea name="description" rows="3" placeholder="這個系列的內容與方向。" />
            </label>
            <ModalFooter onClose={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {modal === "item" && (
        <Modal title="新增貼圖 / 作品" onClose={() => setModal(null)}>
          <form onSubmit={addItems}>
            <div className="formGrid">
              <label>
                所屬主分類
                <select name="categoryId" defaultValue={selectedCategoryId}>
                  {data.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>
                所屬系列
                <select name="seriesId" defaultValue={selectedSeriesId}>
                  {data.series
                    .filter((series) => !selectedCategoryId || series.categoryId === selectedCategoryId)
                    .map((series) => (
                      <option key={series.id} value={series.id}>{series.name}</option>
                    ))}
                </select>
              </label>
            </div>

            <div className="formGrid">
              <label>
                貼圖名稱 / 批次前綴
                <input name="title" placeholder="單張：加班中；多張可留空用檔名" />
                <small>一次選多張時，有填名稱會自動變成「名稱 01、名稱 02」。</small>
              </label>
              <label>
                狀態
                <select name="status" defaultValue="完成">
                  <option>完成</option>
                  <option>草稿</option>
                  <option>待修正</option>
                  <option>暫停</option>
                </select>
              </label>
            </div>

            <label>
              顯示文字
              <input name="displayText" placeholder="例如：加班中；多張可留空" />
            </label>

            <label>
              圖片，可一次選多張
              <input name="image" type="file" accept="image/png,image/jpeg,image/webp" multiple />
              <small>可按住 Ctrl 或 Shift 一次選多張。每張圖片會新增成一筆作品。</small>
            </label>

            <label>
              備註 / 修正方向
              <textarea name="notes" rows="4" placeholder="例如：文字清楚，但角色臉可以更像 Ava_凜。" />
            </label>

            <ModalFooter onClose={() => setModal(null)} submitText="新增作品" />
          </form>
        </Modal>
      )}

      {detailItem && (
        <Modal title={detailItem.title} onClose={() => setDetailItem(null)}>
          <div className="detail">
            <div className="detailImage">
              {detailItem.image ? <img src={detailItem.image} alt={detailItem.title} /> : <div className="placeholder">凜</div>}
            </div>
            <div>
              <p>{detailItem.notes || "尚未填寫備註。"}</p>
              <dl>
                <div><dt>文字</dt><dd>{detailItem.displayText || "無"}</dd></div>
                <div><dt>狀態</dt><dd>{detailItem.status}</dd></div>
              </dl>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modalBackdrop">
      <div className="modalCard">
        <header>
          <h3>{title}</h3>
          <button className="iconBtn" onClick={onClose}>×</button>
        </header>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, submitText = "新增" }) {
  return (
    <footer className="modalFooter">
      <button type="button" className="ghost" onClick={onClose}>取消</button>
      <button type="submit">{submitText}</button>
    </footer>
  );
}