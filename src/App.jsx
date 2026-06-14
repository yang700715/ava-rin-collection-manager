import AuthGate from "./components/AuthGate";
import { useEffect, useMemo, useState } from "react";

import "./App.css";
import seedData from "./data/seedData";

const API_BASE = "http://localhost:5174";

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function loadPublicData() {
  return seedData;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "本機 API 發生錯誤。");
  }

  return data;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSize = 1400;
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

        resolve(canvas.toDataURL("image/webp", 0.9));
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

const hiddenGalleryCategoryIds = new Set([]);

export default function App() {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const isAdmin =
    isLocalhost &&
    new URLSearchParams(window.location.search).get("admin") === "1";

  const [data, setData] = useState(loadPublicData);
  const firstVisibleSeedCategory =
    seedData.categories?.find(
      (category) => !hiddenGalleryCategoryIds.has(category.id)
    ) || seedData.categories?.[0];

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    firstVisibleSeedCategory?.id || ""
  );
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [modal, setModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [apiReady, setApiReady] = useState(!isAdmin ? true : false);

  useEffect(() => {
    if (!isAdmin) {
      setData(seedData);
      return;
    }

    apiRequest("/api/admin-data")
      .then((nextData) => {
        applyData(nextData);
        setApiReady(true);
      })
      .catch((error) => {
        console.error(error);
        setApiReady(false);
        alert(
          "本機寫檔 API 尚未啟動。請用 npm run dev 開啟，不要只開 Vite。"
        );
      });
  }, [isAdmin]);

  function applyData(nextData) {
    setData(nextData);

    const categoryExists = nextData.categories.some(
      (category) => category.id === selectedCategoryId
    );

    const seriesExists = nextData.series.some(
      (series) => series.id === selectedSeriesId
    );

    if (!categoryExists) {
      const firstVisibleCategory =
        nextData.categories.find(
          (category) => !hiddenGalleryCategoryIds.has(category.id)
        ) || nextData.categories[0];

      setSelectedCategoryId(firstVisibleCategory?.id || "");
    }

    if (!seriesExists) {
      setSelectedSeriesId(nextData.series[0]?.id || "");
    }
  }

  const selectedCategory = data.categories.find(
    (category) => category.id === selectedCategoryId
  );

  const visibleCategories = data.categories.filter(
    (category) => !hiddenGalleryCategoryIds.has(category.id)
  );

  const selectedSeries = data.series.find(
    (series) => series.id === selectedSeriesId
  );

  const selectedParentSeries = selectedSeries?.parentSeriesId
    ? data.series.find((series) => series.id === selectedSeries.parentSeriesId)
    : null;

  const isErPangDaiConcept =
    selectedSeriesId === "series-er-pang-dai-design-concept";

  const erPangDaiConceptItem = data.items.find(
    (item) => item.id === "item-er-pang-dai-hooky"
  );

  const breadcrumbParts = [
    selectedCategory?.name || "全部分類",
    ...(selectedParentSeries ? [selectedParentSeries.name] : []),
    selectedSeries?.name || "全部系列",
  ];

  const visibleItems = useMemo(() => {
    const selectedSeriesIds = selectedSeriesId
      ? [
          selectedSeriesId,
          ...data.series
            .filter((series) => series.parentSeriesId === selectedSeriesId)
            .map((series) => series.id),
        ]
      : [];

    return data.items.filter((item) => {
      const matchCategory =
        !selectedCategoryId || item.categoryId === selectedCategoryId;
      const matchSeries =
        !selectedSeriesId || selectedSeriesIds.includes(item.seriesId);
      const matchStatus =
        statusFilter === "全部" || item.status === statusFilter;
      const keyword = `${item.title} ${item.displayText} ${item.notes}`.toLowerCase();
      const matchSearch = !search || keyword.includes(search.toLowerCase());

      return matchCategory && matchSeries && matchStatus && matchSearch;
    });
  }, [
    data.items,
    data.series,
    selectedCategoryId,
    selectedSeriesId,
    search,
    statusFilter,
  ]);

  async function addCategory(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = form.get("name").trim();

    if (!name) {
      alert("請輸入主分類名稱。");
      return;
    }

    try {
      const nextData = await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: form.get("description").trim(),
        }),
      });

      applyData(nextData);

      const created = nextData.categories[nextData.categories.length - 1];
      setSelectedCategoryId(created?.id || "");
      setSelectedSeriesId("");
      setModal(null);
    } catch (error) {
      alert(error.message);
    }
  }

  async function addSeries(event) {
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

    try {
      const nextData = await apiRequest("/api/series", {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          name,
          description: form.get("description").trim(),
        }),
      });

      applyData(nextData);

      const created = nextData.series[nextData.series.length - 1];
      setSelectedCategoryId(created?.categoryId || categoryId);
      setSelectedSeriesId(created?.id || "");
      setModal(null);
    } catch (error) {
      alert(error.message);
    }
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

    try {
      const uploadFiles = [];

      for (const file of files) {
        uploadFiles.push({
          name: file.name,
          type: file.type,
          dataUrl: await fileToDataUrl(file),
        });
      }

      const nextData = await apiRequest("/api/items", {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          seriesId,
          baseTitle,
          displayText,
          status,
          notes,
          files: uploadFiles,
        }),
      });

      applyData(nextData);
      setSelectedCategoryId(categoryId);
      setSelectedSeriesId(seriesId);
      setModal(null);

      if (uploadFiles.length > 1) {
        alert(`已新增 ${uploadFiles.length} 筆作品，並寫入本機資料夾。`);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  async function updateItem(event) {
    event.preventDefault();

    if (!editingItem) return;

    const form = new FormData(event.currentTarget);
    const imageInput = event.currentTarget.querySelector('input[name="image"]');
    const file = imageInput?.files?.[0];

    const title = form.get("title").trim();

    if (!title) {
      alert("作品名稱不能空白。");
      return;
    }

    let uploadFile = null;

    if (file) {
      uploadFile = {
        name: file.name,
        type: file.type,
        dataUrl: await fileToDataUrl(file),
      };
    }

    try {
      const nextData = await apiRequest(`/api/items/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          seriesId: form.get("seriesId"),
          title,
          displayText: form.get("displayText").trim(),
          status: form.get("status"),
          notes: form.get("notes").trim(),
          file: uploadFile,
        }),
      });

      applyData(nextData);
      setEditingItem(null);
      setDetailItem(null);
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteItem(id) {
    const target = data.items.find((item) => item.id === id);
    if (!target) return;

    const ok = confirm(`確定刪除「${target.title}」嗎？圖片檔案也會刪除。`);
    if (!ok) return;

    try {
      const nextData = await apiRequest(`/api/items/${id}`, {
        method: "DELETE",
      });

      applyData(nextData);
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteCategory(id) {
    const category = data.categories.find((entry) => entry.id === id);
    if (!category) return;

    const seriesCount = data.series.filter(
      (entry) => entry.categoryId === id
    ).length;

    const itemCount = data.items.filter(
      (entry) => entry.categoryId === id
    ).length;

    const ok = confirm(
      `確定刪除主分類「${category.name}」嗎？\n\n` +
        `會一併刪除：\n` +
        `系列：${seriesCount} 個\n` +
        `作品：${itemCount} 張\n` +
        `資料夾：public/images/${category.slug}\n\n` +
        `這個動作會真的刪除本機檔案。`
    );

    if (!ok) return;

    try {
      const nextData = await apiRequest(
        `/api/categories/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      applyData(nextData);
      setSelectedCategoryId(nextData.categories[0]?.id || "");
      setSelectedSeriesId(nextData.series[0]?.id || "");
      setDetailItem(null);
      setEditingItem(null);

      alert(`已刪除主分類「${category.name}」。`);
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteSeries(id) {
    const series = data.series.find((entry) => entry.id === id);
    if (!series) return;

    const category = data.categories.find(
      (entry) => entry.id === series.categoryId
    );

    const itemCount = data.items.filter(
      (entry) => entry.seriesId === id
    ).length;

    const ok = confirm(
      `確定刪除系列「${series.name}」嗎？\n\n` +
        `會一併刪除：\n` +
        `作品：${itemCount} 張\n` +
        `資料夾：public/images/${category?.slug || "未分類"}/${series.slug}\n\n` +
        `這個動作會真的刪除本機檔案。`
    );

    if (!ok) return;

    try {
      const nextData = await apiRequest(
        `/api/series/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      applyData(nextData);
      setSelectedCategoryId(category?.id || nextData.categories[0]?.id || "");
      setSelectedSeriesId("");
      setDetailItem(null);
      setEditingItem(null);

      alert(`已刪除系列「${series.name}」。`);
    } catch (error) {
      alert(error.message);
    }
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

      const nextData = await apiRequest("/api/import-data", {
        method: "POST",
        body: JSON.stringify(imported),
      });

      applyData(nextData);
      alert("匯入完成，並已更新 seedData.js。");
    } catch {
      alert("匯入失敗，請確認檔案。");
    }

    event.target.value = "";
  }

  async function reloadAdminData() {
    try {
      const nextData = await apiRequest("/api/admin-data");
      applyData(nextData);
      alert("已重新讀取本機資料。");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <AuthGate>
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">凜</div>
          <div>
            <h1>Ava_凜作品庫</h1>
            <p>{isAdmin ? "Local Admin v0.6ee" : "Gallery Mode v0.6ee"}</p>
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
            <button onClick={reloadAdminData} className="ghost">
              重新讀取本機資料
            </button>
          </div>
        )}

        <nav className="tree">
          {visibleCategories.length === 0 ? (
            <div className="note">
              <strong>尚未建立分類</strong>
              <p>
                {isAdmin
                  ? "請先點「＋ 新增主分類」。"
                  : "目前還沒有公開分類。"}
              </p>
            </div>
          ) : (
            visibleCategories.map((category) => {
              const categoryItems = data.items.filter(
                (item) => item.categoryId === category.id
              );
              const childSeries = data.series.filter(
                (series) =>
                  series.categoryId === category.id && !series.parentSeriesId
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
                    const nestedSeries = data.series.filter(
                      (entry) => entry.parentSeriesId === series.id
                    );

                    const seriesIds = [
                      series.id,
                      ...nestedSeries.map((entry) => entry.id),
                    ];

                    const count = data.items.filter((item) =>
                      seriesIds.includes(item.seriesId)
                    ).length;

                    return (
                      <div className="seriesBranch" key={series.id}>
                        <button
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

                        {nestedSeries.map((nested) => {
                          const nestedCount = data.items.filter(
                            (item) => item.seriesId === nested.id
                          ).length;

                          return (
                            <button
                              key={nested.id}
                              className={`seriesBtn subSeriesBtn ${
                                selectedSeriesId === nested.id ? "active" : ""
                              }`}
                              onClick={() => {
                                setSelectedCategoryId(category.id);
                                setSelectedSeriesId(nested.id);
                              }}
                            >
                              <span>› {nested.name}</span>
                              <em>{nestedCount}</em>
                            </button>
                          );
                        })}
                      </div>
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
              <strong>本機寫檔管理模式</strong>
              <p>
                新增分類會建立資料夾；新增貼圖會寫入 public/images，並更新
                seedData.js。
              </p>
              {!apiReady && <p>API 尚未連線，請確認 npm run dev 有啟動。</p>}
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
              {isAdmin ? "Local File Writer" : "Ava_凜 Works Gallery"}
            </p>
            <h2>分類 ＞ 系列 ＞ 貼圖作品</h2>
          </div>
        </header>

        <section className="hero">
          <div>
            <p className="breadcrumb">
              {breadcrumbParts.join(" ＞ ")}
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

              {selectedSeries && (
                <button
                  className="danger"
                  onClick={() => deleteSeries(selectedSeries.id)}
                >
                  刪除系列
                </button>
              )}

              {selectedCategory && !selectedSeries && (
                <button
                  className="danger"
                  onClick={() => deleteCategory(selectedCategory.id)}
                >
                  刪除分類
                </button>
              )}
            </div>
          )}
        </section>

        {isErPangDaiConcept && erPangDaiConceptItem && (
          <section className="conceptPage">
            <div className="conceptImage">
              <img
                src={erPangDaiConceptItem.image}
                alt={erPangDaiConceptItem.title}
              />
            </div>
            <div className="conceptPanel">
              <p className="eyebrow">Character Concept</p>
              <h3>二胖呆設計概念</h3>
              <p>
                以「翹班中」這張視覺作為二胖呆的角色概念核心，保留慵懶、任性、可愛又有一點小聰明的氣質。
              </p>
              <div className="conceptPoints">
                <div>
                  <strong>角色語氣</strong>
                  <span>鬆弛、直覺、帶點反骨，但不失親近感。</span>
                </div>
                <div>
                  <strong>視覺重點</strong>
                  <span>大字標語、便利貼、墨鏡與翹腳姿態，建立一眼可辨識的偷閒情境。</span>
                </div>
                <div>
                  <strong>延伸方向</strong>
                  <span>可延伸為生活語錄、上班日常、情緒回覆與角色周邊概念。</span>
                </div>
              </div>
              <button
                className="ghost"
                onClick={() => setDetailItem(erPangDaiConceptItem)}
              >
                查看原圖資訊
              </button>
            </div>
          </section>
        )}

        {!isErPangDaiConcept && (
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
        )}

        {!isErPangDaiConcept && (
        <section className="grid">
          {visibleItems.length === 0 ? (
            <div className="emptyCard">
              <h4>目前沒有作品</h4>
              <p>
                {isAdmin
                  ? "點右上角「＋ 新增貼圖」，可以一次選多張圖片。"
                  : "這個分類或系列目前還沒有公開作品。"}
              </p>
            </div>
          ) : (
            visibleItems.map((item) => (
              <article className="card" key={item.id}>
                <div className="imageBox">
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
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
        )}
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
                <img src={detailItem.image} alt={detailItem.title} />
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
                <div>
                  <dt>圖片</dt>
                  <dd>{detailItem.image || "無"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </AuthGate>
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
            圖片會寫入 public/images/主分類/系列，並自動更新 seedData.js。
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
          <small>
            不選圖片就保留原圖；選新圖片會寫入資料夾並更新路徑。
          </small>
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
