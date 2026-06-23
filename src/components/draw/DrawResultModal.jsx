export default function DrawResultModal({ result, onClose }) {
  if (!result) return null;

  const isRare = result.tier.includes("稀有");
  const levelClass = result.isGrand ? "grand" : isRare ? "rare" : "normal";
  const confettiCount = result.isGrand ? 28 : isRare ? 16 : 8;

  return (
    <div
      className={`drawResultBackdrop ${levelClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="draw-result-title"
    >
      <div className="drawResultCard">
        <div className="drawConfetti" aria-hidden="true">
          {Array.from({ length: confettiCount }).map((_, index) => (
            <span
              key={index}
              style={{
                "--delay": `${index * 0.045}s`,
                "--x": `${(index % 9) * 13 - 52}px`,
              }}
            />
          ))}
        </div>
        <p className="drawResultLabel">
          {result.isGrand ? "小小源大賞！" : result.tier}
        </p>
        <h3 id="draw-result-title">{result.prizeName}</h3>
        <p>{new Date(result.drawnAt).toLocaleString("zh-TW")}</p>
        <button type="button" onClick={onClose}>
          收下結果
        </button>
      </div>
    </div>
  );
}
