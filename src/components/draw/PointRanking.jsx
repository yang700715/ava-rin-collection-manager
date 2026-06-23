import { getRanking } from "../../utils/pointUtils";

export default function PointRanking({ balances }) {
  const ranking = getRanking(balances);

  return (
    <section className="drawPanel pointRankingPanel">
      <div className="drawPanelHeader">
        <div>
          <p className="drawKicker">Ranking</p>
          <h3>觀眾總點數排行榜</h3>
        </div>
      </div>

      <div className="pointRankingList">
        {ranking.length === 0 ? (
          <p className="drawEmpty">尚未有點數紀錄。</p>
        ) : (
          ranking.map((entry, index) => (
            <article className="pointRankingRow" key={entry.viewerName}>
              <span>{index + 1}</span>
              <strong>{entry.viewerName}</strong>
              <em>{entry.points} 點</em>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
