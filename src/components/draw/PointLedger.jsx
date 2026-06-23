import { exportJsonFile, exportRowsAsCsv } from "../../utils/exportUtils";
import PointRanking from "./PointRanking";

export default function PointLedger({
  ledger,
  balances,
  redemptions,
  onClearLedger,
}) {
  const exportJson = () => {
    exportJsonFile(`xiaoxiaoyuan-point-ledger-${Date.now()}.json`, {
      ledger,
      balances,
      redemptions,
    });
  };

  const exportCsv = () => {
    exportRowsAsCsv(`xiaoxiaoyuan-point-ledger-${Date.now()}.csv`, [
      ["時間", "觀眾名稱", "平台", "來源類型", "原始數量", "換算後點數", "備註"],
      ...ledger.map((record) => [
        new Date(record.createdAt).toLocaleString("zh-TW"),
        record.viewerName,
        record.platform,
        record.sourceType,
        record.rawAmount,
        record.points,
        record.note,
      ]),
    ]);
  };

  return (
    <div className="pointLedgerLayout">
      <section className="drawPanel">
        <div className="drawPanelHeader">
          <div>
            <p className="drawKicker">Ledger</p>
            <h3>觀眾點數紀錄</h3>
          </div>
          <div className="drawHistoryActions">
            <button
              className="ghost small"
              type="button"
              disabled={ledger.length === 0}
              onClick={exportJson}
            >
              JSON
            </button>
            <button
              className="ghost small"
              type="button"
              disabled={ledger.length === 0}
              onClick={exportCsv}
            >
              CSV
            </button>
            <button
              className="ghost small"
              type="button"
              disabled={ledger.length === 0}
              onClick={onClearLedger}
            >
              清除
            </button>
          </div>
        </div>

        <div className="pointLedgerList">
          {ledger.length === 0 ? (
            <p className="drawEmpty">尚未有觀眾點數紀錄。</p>
          ) : (
            ledger.map((record) => (
              <article className="pointLedgerRow" key={record.id}>
                <div>
                  <strong>{record.viewerName}</strong>
                  <span>
                    {record.platform} / {record.sourceType}
                  </span>
                  <small>{record.rawAmount}</small>
                  {record.note && <small>{record.note}</small>}
                </div>
                <div>
                  <em>+{record.points} 點</em>
                  <time dateTime={record.createdAt}>
                    {new Date(record.createdAt).toLocaleString("zh-TW")}
                  </time>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="pointSideStack">
        <PointRanking balances={balances} />
        <section className="drawPanel">
          <div className="drawPanelHeader">
            <div>
              <p className="drawKicker">Redemptions</p>
              <h3>兌換紀錄</h3>
            </div>
          </div>
          <div className="ticketRedemptionList">
            {redemptions.length === 0 ? (
              <p className="drawEmpty">尚未有兌換紀錄。</p>
            ) : (
              redemptions.map((record) => (
                <article className="ticketRedemptionRow" key={record.id}>
                  <div>
                    <strong>{record.viewerName}</strong>
                    <span>
                      {new Date(record.redeemedAt).toLocaleString("zh-TW")}
                    </span>
                  </div>
                  <em>{record.ticketCount} 張 / -{record.pointsSpent} 點</em>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
