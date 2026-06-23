import { useState } from "react";

const emptyForm = {
  name: "",
  tier: "普通獎",
  quantity: 1,
  isGrand: false,
};

export default function PrizeEditor({ prizes, onAddPrize, onDeletePrize }) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (onAddPrize(form)) {
      setForm(emptyForm);
    }
  };

  return (
    <section className="drawPanel">
      <div className="drawPanelHeader">
        <div>
          <p className="drawKicker">Prize Pool</p>
          <h3>建立獎池</h3>
        </div>
      </div>

      <form className="drawPrizeForm" onSubmit={handleSubmit}>
        <label>
          獎項名稱
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="例如：星光收藏牌"
          />
        </label>
        <label>
          獎項等級
          <input
            value={form.tier}
            onChange={(event) =>
              setForm((current) => ({ ...current, tier: event.target.value }))
            }
            placeholder="普通獎 / 稀有獎"
          />
        </label>
        <label>
          獎項數量
          <input
            min="0"
            type="number"
            value={form.quantity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                quantity: event.target.value,
              }))
            }
          />
        </label>
        <label className="drawCheckRow">
          <input
            type="checkbox"
            checked={form.isGrand}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isGrand: event.target.checked,
              }))
            }
          />
          是否為大獎
        </label>
        <button type="submit">新增獎項</button>
      </form>

      <div className="drawPrizeList">
        {prizes.length === 0 ? (
          <p className="drawEmpty">尚未建立獎項。</p>
        ) : (
          prizes.map((prize) => (
            <article
              className={`drawPrizeRow ${prize.isGrand ? "isGrand" : ""}`}
              key={prize.id}
            >
              <div>
                <strong>{prize.isGrand ? "小小源大賞！" : prize.name}</strong>
                <span>{prize.isGrand ? prize.name : prize.tier}</span>
              </div>
              <div className="drawRowActions">
                <span>{prize.quantity} 份</span>
                <button
                  className="ghost small"
                  type="button"
                  onClick={() => onDeletePrize(prize.id)}
                >
                  刪除
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
