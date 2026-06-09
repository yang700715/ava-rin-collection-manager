import { useEffect, useMemo, useState } from "react";
import "./App.css";
import seedData from "./data/seedData";

const STORAGE_KEY = "avaRinCollectionManager.react.admin.v0.4";

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function loadData(isAdmin) {
  if (!isAdmin) {
    return seedData;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedData;
  } catch {
    return seedData;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("儲存失敗：", error);
    alert(
      "圖片太大或太多，瀏覽器 localStorage 存不下。公開展示建議使用 public/images + seedData.js。"
    );
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

        resolve(canvas.toDataURL("image/webp", 0.85));
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function cleanFileName(name) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim() || "未命名作品"
  );
}

export default function App() {
  const isAdmin =
    new URLSearchParams(window.location.search).get("admin") === "1";

  const [data, setData] = useState(() => loadData(isAdmin));
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    seedData.categories?.[0]?.id || ""
  );
  const [selectedSeriesId, setSelectedSeriesId] = useState(
    seedData.series?.[0]?.id || ""
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [modal, setModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      saveData(data);
    }
  }, [data, isAdmin]);

  const selectedCategory = data.categories.find(
    (category) => category.id === selectedCategoryId
  );

  const selectedSeries = data.series.find(
    (series) => series.id === selectedSeriesId
  );

  const visibleItems = useMemo(() => {
    return data.items.filter((item) => {
      const matchCategory =
        !selectedCategoryId || item.categoryId === selectedCategoryId;
      const matchSeries =
        !selectedSeriesId || item.seriesId === selectedSeriesId;
      const matchStatus =
        statusFilter === "全部" || item.status === statusFilter;
      const keyword = `${item.title} ${item.displayText} ${item.notes}`.toLowerCase();
      const matchSearch = !search || keyword.includes(search.toLowerCase());

      return matchCategory && matchSeries && matchStatus && matchSearch;
    });
  }, [data.items, selectedCategoryId, selectedSeriesId, search, statusFilter]);

  function updateData(nextData) {
    setData(nextData);
  }

  function resetToSeedData() {
    updateData(seedData);
    setSelectedCategoryId(seedData.categories?.[0]?.id || "");
    setSelectedSeriesId(seedData.series?.[0]?.id || "");
    setSearch("");
    setStatusFilter("全部");
    setModal(null);
    setDetailItem(null);
    setEditingItem(null);
  }

  function addCategory(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = form.get("name").trim();

    if (!name) {
      alert("請輸入主分類名稱。");
      return;
    }

    const category = {
      id: uid("cat"),
      name,
      description: form.get("description").trim(),
    };

    updateData({
      ...data,
      categories: [...data.categories, category],
    });

    setSelectedCategoryId(category.id);
    setSelectedSeriesId("");
    setModal(null);
  }

  function addSeries(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const categoryId = form.get("categoryId");
    const name = form.get("name").trim();

    if (!categoryId) {
      alert("請先新增主分類。");
      return;
    }

    if (!name) {
      alert("請輸入系列名稱。");
      return;
    }

    const series = {
      id: uid("series"),
      categoryId,
      name,
      description: form.get("description").trim(),
    };

    updateData({
      ...data,
      series: [...data.series, series],
    });

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

    if (!categoryId) {
      alert("請先選擇主分類。");
      return;
    }

    if (!seriesId) {
      alert("請先選擇系列，或先新增一個系列。");
      return;
    }

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

  async function updateItem(event) {
    event.preventDefault();

    if (!editingItem) return;

    const form = new FormData(event.currentTarget);
    const imageInput = event.currentTarget.querySelector('input[name="image"]');
    const file = imageInput?.files?.[0];

    const seriesId = form.get("seriesId");
    const series = data.series.find((entry) => entry.id === seriesId);

    if (!series) {
      alert("請選擇有效的系列。");
      return;
    }

    const categoryId = series.categoryId;
    const title = form.get("title").trim();

    if (!title) {
      alert("作品名稱不能空白。");
      return;
    }

    let image = editingItem.image;

    if (file) {
      image = await fileToDataUrl(file);
    }

    const updatedItem = {
      ...editingItem,
      categoryId,
      seriesId,
      title,
      displayText: form.get("displayText").trim() || title,
      status: form.get("status"),
      image,
      notes: form.get("notes").trim(),
    };

    updateData({
      ...data,
      items: data.items.map((item) =>
        item.id === editingItem.id ? updatedItem : item
      ),
    });

    setSelectedCategoryId(categoryId);
    setSelectedSeriesId(seriesId);
    setEditingItem(null);
    setDetailItem(null);
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
    link.download = `ava-rin-collection-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (
        !Array.isArray(imported.categories) ||
        !Array.isArray(imported.series) ||
        !Array.isArray(imported.items)
      ) {
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
    setSearch("");
    setStatusFilter("全部");
    setModal(null);
    setDetailItem(null);
    setEditingItem(null);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">凜</div>
          <div>
            <h1>Ava_凜 作品庫</h1>
            <p>{isAdmin ? "Admin Mode v0.4" : "Gallery Mode v0.4"}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="sideActions">
            <button onClick={() => setModal("category")}>＋ 新增主分類</button>
            <button onClick={exportJson} className="ghost">
              匯出 JSON
            </button>
            <label className="ghost fileLabel">
              匯入 JSON
              <input
                type="file"
                accept="application/json"
                onChange={importJson}
              />
            </label>
          </div>
        )}

        <nav className="tree">
          {data.categories.length === 0 ? (
            <div className="note">
              <strong>尚未建立分類</strong>
              <p>
                {isAdmin
                  ? "請先點「＋ 新增主分類」。"
                  : "目前還沒有公開分類。"}
              </p>
            </div>
          ) : (
            data.categories.map((category) => {
              const categoryItems = data.items.filter(
                (item) => item.categoryId === category.id
              );
              const childSeries = data.series.filter(
                (series) => series.categoryId === category.id
              );

              return (
                <div className="treeGroup" key={category.id}>
                  <button
                    className={
                      selectedCategoryId === category.id && !selectedSeriesId
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedSeriesId("");
                    }}
                  >
                    <span>{category.name}</span>
                    <em>{categoryItems.length}</em>
                  </button>

                  {childSeries.map((series) => {
                    const count = data.items.filter(
                      (item) => item.seriesId === series.id
                    ).length;

                    return (
                      <button
                        key={series.id}
                        className={`seriesBtn ${
                          selectedSeriesId === series.id ? "active" : ""
                        }`}
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
            })
          )}
        </nav>

        <div className="note">
          {isAdmin ? (
            <>
              <strong>管理模式</strong>
              <p>
                這裡是本機管理用。公開展示建議使用 public/images +
                seedData.js。
              </p>
            </>
          ) : (
            <>
              <strong>展示模式</strong>
              <p>此頁只顯示作品，不顯示新增、編輯、刪除按鈕。</p>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              {isAdmin
                ? "Editable Website Prototype"
                : "Ava_凜 Works Gallery"}
            </p>
            <h2>分類 ＞ 系列 ＞ 貼圖作品</h2>
          </div>

          {isAdmin && (
            <div className="topActions">
              <button className="ghost" onClick={resetToSeedData}>
                讀取公開資料
              </button>
              <button className="danger" onClick={clearAll}>
                清空資料
              </button>
            </div>
          )}
        </header>

        <section className="hero">
          <div>
            <p className="breadcrumb">
              {selectedCategory?.name || "全部分類"} ＞{" "}
              {selectedSeries?.name || "全部系列"} ＞ 貼圖
            </p>
            <h3>
              {selectedSeries?.name || selectedCategory?.name || "全部作品"}
            </h3>
            <p>
              {selectedSeries?.description ||
                selectedCategory?.description ||
                "目前尚未建立分類、系列與作品。"}
            </p>
          </div>

          {isAdmin && (
            <div className="quickActions">
              <button onClick={() => setModal("series")}>＋ 新增系列</button>
              <button onClick={() => setModal("item")}>＋ 新增貼圖</button>
            </div>
          )}
        </section>

        <section className="toolbar">
          <input
            type="search"
            placeholder="搜尋貼圖名稱、文字、備註，例如：加班中、工作篇、Ava"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
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
              <p>
                {isAdmin
                  ? "可用「讀取公開資料」載入 seedData，或點右上角新增作品。"
                  : "這個分類或系列目前還沒有公開作品。"}
              </p>
            </div>
          ) : (
            visibleItems.map((item) => (
              <article className="card" key={item.id}>
                <div className="imageBox">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      draggable="false"
                      onContextMenu={(event) => event.preventDefault()}
                    />
                  ) : (
                    <div className="placeholder">凜</div>
                  )}
                </div>

                <div className="cardBody">
                  <div className="badges">
                    <span className={`badge ${item.status}`}>
                      {item.status}
                    </span>
                    {item.displayText && (
                      <span className="badge light">{item.displayText}</span>
                    )}
                  </div>

                  <h4>{item.title}</h4>
                  <p>{item.notes || "尚未填寫備註。"}</p>

                  <div className="cardActions">
                    <button
                      className="ghost small"
                      onClick={() => setDetailItem(item)}
                    >
                      查看
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          className="ghost small"
                          onClick={() => setEditingItem(item)}
                        >
                          編輯
                        </button>
                        <button
                          className="danger small"
                          onClick={() => deleteItem(item.id)}
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {isAdmin && modal === "category" && (
        <Modal title="新增主分類" onClose={() => setModal(null)}>
          <form onSubmit={addCategory}>
            <label>
              主分類名稱
              <input
                name="name"
                required
                placeholder="例如：LINE 貼圖、周邊、公仔"
              />
            </label>
            <label>
              說明
              <textarea
                name="description"
                rows="3"
                placeholder="這個分類要放什麼作品？"
              />
            </label>
            <ModalFooter onClose={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {isAdmin && modal === "series" && (
        <Modal title="新增系列" onClose={() => setModal(null)}>
          <form onSubmit={addSeries}>
            <label>
              所屬主分類
              <select name="categoryId" defaultValue={selectedCategoryId}>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              系列名稱
              <input
                name="name"
                required
                placeholder="例如：Ava_凜 工作篇 1"
              />
            </label>
            <label>
              系列說明
              <textarea
                name="description"
                rows="3"
                placeholder="這個系列的內容與方向。"
              />
            </label>
            <ModalFooter onClose={() => setModal(null)} />
          </form>
        </Modal>
      )}

      {isAdmin && modal === "item" && (
        <AddItemModal
          data={data}
          selectedCategoryId={selectedCategoryId}
          selectedSeriesId={selectedSeriesId}
          onClose={() => setModal(null)}
          onSubmit={addItems}
        />
      )}

      {isAdmin && editingItem && (
        <EditItemModal
          data={data}
          editingItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={updateItem}
        />
      )}

      {detailItem && (
        <Modal title={detailItem.title} onClose={() => setDetailItem(null)}>
          <div className="detail">
            <div className="detailImage">
              {detailItem.image ? (
                <img
                  src={detailItem.image}
                  alt={detailItem.title}
                  draggable="false"
                  onContextMenu={(event) => event.preventDefault()}
                />
              ) : (
                <div className="placeholder">凜</div>
              )}
            </div>
            <div>
              <p>{detailItem.notes || "尚未填寫備註。"}</p>
              <dl>
                <div>
                  <dt>文字</dt>
                  <dd>{detailItem.displayText || "無"}</dd>
                </div>
                <div>
                  <dt>狀態</dt>
                  <dd>{detailItem.status}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddItemModal({
  data,
  selectedCategoryId,
  selectedSeriesId,
  onClose,
  onSubmit,
}) {
  const firstCategoryId = data.categories[0]?.id || "";
  const initialCategoryId = selectedCategoryId || firstCategoryId;

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [seriesId, setSeriesId] = useState("");

  const seriesList = useMemo(() => {
    return data.series.filter((series) => series.categoryId === categoryId);
  }, [data.series, categoryId]);

  useEffect(() => {
    const validSelectedSeries = seriesList.some(
      (series) => series.id === selectedSeriesId
    );

    if (validSelectedSeries) {
      setSeriesId(selectedSeriesId);
      return;
    }

    setSeriesId(seriesList[0]?.id || "");
  }, [selectedSeriesId, seriesList]);

  return (
    <Modal title="新增貼圖 / 作品" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="formGrid">
          <label>
            所屬主分類
            <select
              name="categoryId"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {data.categories.length === 0 ? (
                <option value="">請先新增主分類</option>
              ) : (
                data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            所屬系列
            <select
              name="seriesId"
              value={seriesId}
              onChange={(event) => setSeriesId(event.target.value)}
            >
              {seriesList.length === 0 ? (
                <option value="">請先新增系列</option>
              ) : (
                seriesList.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        <div className="formGrid">
          <label>
            貼圖名稱 / 批次前綴
            <input
              name="title"
              placeholder="單張：加班中；多張可留空用檔名"
            />
            <small>
              一次選多張時，有填名稱會自動變成「名稱 01、名稱 02」。
            </small>
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
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
          />
          <small>
            可按住 Ctrl 或 Shift 一次選多張。每張圖片會新增成一筆作品。
          </small>
        </label>

        <label>
          備註 / 修正方向
          <textarea
            name="notes"
            rows="4"
            placeholder="例如：文字清楚，但角色臉可以更像 Ava_凜。"
          />
        </label>

        <ModalFooter onClose={onClose} submitText="新增作品" />
      </form>
    </Modal>
  );
}

function EditItemModal({ data, editingItem, onClose, onSubmit }) {
  return (
    <Modal title={`編輯作品｜${editingItem.title}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <label>
          所屬系列
          <select name="seriesId" defaultValue={editingItem.seriesId}>
            {data.series.length === 0 ? (
              <option value="">請先新增系列</option>
            ) : (
              data.series.map((series) => {
                const category = data.categories.find(
                  (entry) => entry.id === series.categoryId
                );

                return (
                  <option key={series.id} value={series.id}>
                    {category?.name || "未分類"} ＞ {series.name}
                  </option>
                );
              })
            )}
          </select>
        </label>

        <div className="formGrid">
          <label>
            貼圖名稱
            <input
              name="title"
              required
              defaultValue={editingItem.title}
              placeholder="例如：加班中"
            />
          </label>

          <label>
            狀態
            <select name="status" defaultValue={editingItem.status}>
              <option>完成</option>
              <option>草稿</option>
              <option>待修正</option>
              <option>暫停</option>
            </select>
          </label>
        </div>

        <label>
          顯示文字
          <input
            name="displayText"
            defaultValue={editingItem.displayText}
            placeholder="例如：加班中"
          />
        </label>

        <label>
          替換圖片
          <input
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          />
          <small>不選圖片就會保留原本圖片；選新圖片會替換掉原圖。</small>
        </label>

        <label>
          備註 / 修正方向
          <textarea
            name="notes"
            rows="4"
            defaultValue={editingItem.notes}
            placeholder="例如：文字清楚，但角色臉可以更像 Ava_凜。"
          />
        </label>

        <ModalFooter onClose={onClose} submitText="儲存修改" />
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modalBackdrop">
      <div className="modalCard">
        <header>
          <h3>{title}</h3>
          <button className="iconBtn" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, submitText = "新增" }) {
  return (
    <footer className="modalFooter">
      <button type="button" className="ghost" onClick={onClose}>
        取消
      </button>
      <button type="submit">{submitText}</button>
    </footer>
  );
}