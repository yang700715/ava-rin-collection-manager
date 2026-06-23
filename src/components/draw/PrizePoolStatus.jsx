export default function PrizePoolStatus({ prizes, remaining, onResetPool }) {
  const grandRemaining = prizes.filter(
    (prize) => prize.isGrand && prize.quantity > 0
  ).length;
  const maxQuantity = Math.max(...prizes.map((prize) => prize.quantity), 1);

  return (
    <section className="drawPanel">
      <div className="drawPanelHeader">
        <div>
          <p className="drawKicker">Status</p>
          <h3>獎池狀態</h3>
        </div>
        <button type="button" className="ghost" onClick={onResetPool}>
          重置獎池
        </button>
      </div>

      <div className="drawStats">
        <div>
          <span>剩餘總數</span>
          <strong>{remaining}</strong>
        </div>
        <div>
          <span>獎項種類</span>
          <strong>{prizes.length}</strong>
        </div>
        <div>
          <span>大獎尚在</span>
          <strong>{grandRemaining}</strong>
        </div>
      </div>

      <div className="drawStockList">
        {prizes.map((prize) => {
          const width =
            prize.quantity === 0
              ? "0%"
              : `${Math.max(6, (prize.quantity / maxQuantity) * 100)}%`;

          return (
            <div className="drawStockItem" key={prize.id}>
              <div>
                <span>{prize.name}</span>
                <strong>{prize.quantity}</strong>
              </div>
              <div className="drawStockTrack">
                <span style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
