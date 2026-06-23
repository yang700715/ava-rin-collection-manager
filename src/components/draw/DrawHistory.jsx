import {
  exportHistoryAsCsv,
  exportHistoryAsJson,
} from "../../utils/exportUtils";

export default function DrawHistory({ history, onClearHistory }) {
  return (
    <section className="drawPanel">
      <div className="drawPanelHeader">
        <div>
          <p className="drawKicker">History</p>
          <h3>抽獎紀錄</h3>
        </div>
        <div className="drawHistoryActions">
          <button
            className="ghost small"
            type="button"
            disabled={history.length === 0}
            onClick={() => exportHistoryAsJson(history)}
          >
            JSON
          </button>
          <button
            className="ghost small"
            type="button"
            disabled={history.length === 0}
            onClick={() => exportHistoryAsCsv(history)}
          >
            CSV
          </button>
          <button
            className="ghost small"
            type="button"
            disabled={history.length === 0}
            onClick={onClearHistory}
          >
            清除
          </button>
        </div>
      </div>

      <div className="drawHistoryList">
        {history.length === 0 ? (
          <p className="drawEmpty">還沒有抽獎紀錄。</p>
        ) : (
          history.map((record) => (
            <article
              className={`drawHistoryRow ${record.isGrand ? "isGrand" : ""}`}
              key={record.id}
            >
              <div>
                <strong>
                  {record.isGrand ? "小小源大賞！" : record.prizeName}
                </strong>
                <span>{record.isGrand ? record.prizeName : record.tier}</span>
              </div>
              <time dateTime={record.drawnAt}>
                {new Date(record.drawnAt).toLocaleString("zh-TW")}
              </time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
