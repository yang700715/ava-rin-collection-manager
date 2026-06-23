import { useMemo, useState } from "react";
import { TICKET_POINT_COST, getRanking } from "../../utils/pointUtils";

export default function TicketRedemption({
  balances,
  redemptions,
  onRedeemTickets,
}) {
  const ranking = useMemo(() => getRanking(balances), [balances]);
  const [viewerName, setViewerName] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [message, setMessage] = useState("");

  const selectedBalance = Number(balances[viewerName] || 0);
  const cost = Math.max(0, Number(ticketCount) || 0) * TICKET_POINT_COST;

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = viewerName.trim();
    const count = Math.max(0, Number(ticketCount) || 0);

    if (!name) {
      setMessage("請選擇或輸入觀眾名稱。");
      return;
    }

    if (count <= 0) {
      setMessage("兌換張數必須大於 0。");
      return;
    }

    if (Number(balances[name] || 0) < count * TICKET_POINT_COST) {
      setMessage("點數不足，無法兌換抽賞券。");
      return;
    }

    onRedeemTickets(name, count);
    setMessage(`已兌換 ${count} 張抽賞券。`);
    setTicketCount(1);
  };

  return (
    <section className="drawPanel">
      <div className="drawPanelHeader">
        <div>
          <p className="drawKicker">Tickets</p>
          <h3>點數兌換抽賞券</h3>
        </div>
        <span className="pointRate">100 點 = 1 張</span>
      </div>

      <p className="pointNotice">點數僅作為活動抽賞券兌換使用，不保證中獎。</p>

      <form className="pointForm compact" onSubmit={handleSubmit}>
        <label>
          觀眾名稱
          <input
            list="point-viewers"
            value={viewerName}
            onChange={(event) => setViewerName(event.target.value)}
            placeholder="輸入或選擇觀眾"
          />
          <datalist id="point-viewers">
            {ranking.map((entry) => (
              <option key={entry.viewerName} value={entry.viewerName} />
            ))}
          </datalist>
        </label>
        <label>
          兌換張數
          <input
            min="1"
            type="number"
            value={ticketCount}
            onChange={(event) => setTicketCount(event.target.value)}
          />
        </label>
        <div className="pointExchangeSummary">
          <span>目前點數：{selectedBalance}</span>
          <span>本次扣除：{cost}</span>
        </div>
        <button type="submit">兌換抽賞券</button>
      </form>

      {message && <div className="drawAlert">{message}</div>}

      <div className="ticketRedemptionList">
        {redemptions.length === 0 ? (
          <p className="drawEmpty">尚未有兌換紀錄。</p>
        ) : (
          redemptions.slice(0, 6).map((record) => (
            <article className="ticketRedemptionRow" key={record.id}>
              <div>
                <strong>{record.viewerName}</strong>
                <span>{new Date(record.redeemedAt).toLocaleString("zh-TW")}</span>
              </div>
              <em>{record.ticketCount} 張 / -{record.pointsSpent} 點</em>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
