import { useEffect, useMemo, useState } from "react";
import DrawHistory from "./DrawHistory";
import DrawResultModal from "./DrawResultModal";
import PointExchange from "./PointExchange";
import PointLedger from "./PointLedger";
import PrizeEditor from "./PrizeEditor";
import PrizePoolStatus from "./PrizePoolStatus";
import {
  drawPrize,
  getTotalRemaining,
  normalizePrizes,
} from "../../utils/drawUtils";
import {
  POINT_BALANCES_KEY,
  POINT_LEDGER_KEY,
  TICKET_POINT_COST,
  TICKET_REDEMPTIONS_KEY,
  applyPointRecord,
  applyTicketRedemption,
} from "../../utils/pointUtils";

const PRIZE_STORAGE_KEY = "xiaoxiaoyuan-draw-prizes";
const HISTORY_STORAGE_KEY = "xiaoxiaoyuan-draw-history";

const starterPrizes = [
  {
    id: "starter-grand",
    name: "星光收藏牌",
    tier: "小小源大賞",
    quantity: 1,
    isGrand: true,
  },
  {
    id: "starter-rare",
    name: "金色祝福票",
    tier: "稀有獎",
    quantity: 3,
    isGrand: false,
  },
  {
    id: "starter-normal-a",
    name: "微光貼紙組",
    tier: "普通獎",
    quantity: 8,
    isGrand: false,
  },
  {
    id: "starter-normal-b",
    name: "幸運小吊牌",
    tier: "普通獎",
    quantity: 10,
    isGrand: false,
  },
];

const rollingNames = [
  "星光轉動中",
  "幸運聚集中",
  "票券翻開中",
  "小小源加持中",
];

const tabs = [
  { id: "draw", label: "抽賞機" },
  { id: "points", label: "點數兌換" },
  { id: "ledger", label: "觀眾點數紀錄" },
  { id: "history", label: "抽獎紀錄" },
];

const readStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export default function DrawMachine({ backLabel = "回作品庫", onBack }) {
  const [activeTab, setActiveTab] = useState("draw");
  const [prizes, setPrizes] = useState(() =>
    normalizePrizes(readStoredJson(PRIZE_STORAGE_KEY, starterPrizes))
  );
  const [history, setHistory] = useState(() =>
    readStoredJson(HISTORY_STORAGE_KEY, [])
  );
  const [pointLedger, setPointLedger] = useState(() =>
    readStoredJson(POINT_LEDGER_KEY, [])
  );
  const [pointBalances, setPointBalances] = useState(() =>
    readStoredJson(POINT_BALANCES_KEY, {})
  );
  const [ticketRedemptions, setTicketRedemptions] = useState(() =>
    readStoredJson(TICKET_REDEMPTIONS_KEY, [])
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewName, setPreviewName] = useState("準備抽出幸運票券");

  const remaining = useMemo(() => getTotalRemaining(prizes), [prizes]);
  const availableNames = useMemo(() => {
    const names = prizes
      .filter((prize) => prize.quantity > 0)
      .map((prize) => prize.name);

    return names.length > 0 ? names : rollingNames;
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem(PRIZE_STORAGE_KEY, JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(POINT_LEDGER_KEY, JSON.stringify(pointLedger));
  }, [pointLedger]);

  useEffect(() => {
    localStorage.setItem(POINT_BALANCES_KEY, JSON.stringify(pointBalances));
  }, [pointBalances]);

  useEffect(() => {
    localStorage.setItem(
      TICKET_REDEMPTIONS_KEY,
      JSON.stringify(ticketRedemptions)
    );
  }, [ticketRedemptions]);

  useEffect(() => {
    if (!isDrawing) {
      setPreviewName(remaining > 0 ? "準備抽出幸運票券" : "獎池已空");
      return undefined;
    }

    const timer = window.setInterval(() => {
      setPreviewName(
        availableNames[Math.floor(Math.random() * availableNames.length)]
      );
    }, 80);

    return () => window.clearInterval(timer);
  }, [availableNames, isDrawing, remaining]);

  const handleAddPrize = (prize) => {
    const name = prize.name.trim();
    const quantity = Number(prize.quantity);

    if (!name) {
      setError("獎項名稱不能空白。");
      return false;
    }

    if (quantity < 0) {
      setError("獎項數量不可小於 0。");
      return false;
    }

    setPrizes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        tier: prize.tier.trim() || "普通獎",
        quantity: Number.isFinite(quantity) ? quantity : 0,
        isGrand: Boolean(prize.isGrand),
      },
    ]);
    setError("");
    return true;
  };

  const handleDraw = () => {
    if (prizes.length === 0) {
      setError("沒有獎項，請先建立獎池。");
      return;
    }

    if (remaining <= 0) {
      setError("獎池已空，不能再抽。");
      return;
    }

    setError("");
    setIsDrawing(true);

    window.setTimeout(() => {
      const selectedPrize = drawPrize(prizes);

      if (!selectedPrize) {
        setError("獎池已空，不能再抽。");
        setIsDrawing(false);
        return;
      }

      const record = {
        id: crypto.randomUUID(),
        drawnAt: new Date().toISOString(),
        prizeName: selectedPrize.name,
        tier: selectedPrize.tier,
        isGrand: selectedPrize.isGrand,
      };

      setPrizes((current) =>
        current.map((prize) =>
          prize.id === selectedPrize.id
            ? { ...prize, quantity: Math.max(0, prize.quantity - 1) }
            : prize
        )
      );
      setHistory((current) => [record, ...current]);
      setResult(record);
      setIsDrawing(false);
    }, 1600);
  };

  const handleResetPool = () => {
    setPrizes(normalizePrizes(starterPrizes));
    setResult(null);
    setError("");
  };

  const handleAddPointRecord = (record) => {
    const fullRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setPointLedger((current) => [fullRecord, ...current]);
    setPointBalances((current) => applyPointRecord(current, fullRecord));
  };

  const handleRedeemTickets = (viewerName, ticketCount) => {
    const count = Number(ticketCount);
    const redemption = {
      id: crypto.randomUUID(),
      redeemedAt: new Date().toISOString(),
      viewerName,
      ticketCount: count,
      pointsSpent: count * TICKET_POINT_COST,
    };

    setTicketRedemptions((current) => [redemption, ...current]);
    setPointBalances((current) =>
      applyTicketRedemption(current, viewerName, count)
    );
  };

  const handleClearPointLedger = () => {
    setPointLedger([]);
    setPointBalances({});
    setTicketRedemptions([]);
  };

  return (
    <section className="drawPage">
      <div className="drawHero">
        <div>
          <p className="drawKicker">Original Browser Draw Tool</p>
          <h2>小小源抽賞機</h2>
          <p>免 API・不燒錢・純瀏覽器抽獎</p>
        </div>
        {onBack && (
          <button className="ghost" type="button" onClick={onBack}>
            {backLabel}
          </button>
        )}
      </div>

      <div className="drawTabs" role="tablist" aria-label="小小源抽賞機頁籤">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="drawAlert">{error}</div>}

      {activeTab === "draw" && (
        <>
          <div className="drawLayout">
            <section className="drawMachinePanel">
              <div className="drawMachineTop">
                <div>
                  <p className="drawKicker">Draw Machine</p>
                  <h3>抽賞票券</h3>
                </div>
                <span>剩餘 {remaining} 份</span>
              </div>

              <div
                className={`drawTicketStage ${isDrawing ? "isDrawing" : ""}`}
              >
                <div className="drawTicketCard">
                  <div className="drawTicketFace drawTicketFront">
                    <strong>小小源</strong>
                    <p>{previewName}</p>
                  </div>
                  <div className="drawTicketFace drawTicketBack">
                    <strong>OPEN</strong>
                    <p>幸運揭曉中</p>
                  </div>
                </div>
                <div className="drawSparkRing" />
              </div>

              <button
                className="drawPrimaryAction"
                type="button"
                disabled={isDrawing || remaining <= 0}
                onClick={handleDraw}
              >
                {isDrawing ? "抽賞中..." : "抽一次"}
              </button>
            </section>

            <PrizePoolStatus
              prizes={prizes}
              remaining={remaining}
              onResetPool={handleResetPool}
            />
          </div>

          <div className="drawManagerLayout">
            <PrizeEditor
              prizes={prizes}
              onAddPrize={handleAddPrize}
              onDeletePrize={(id) =>
                setPrizes((current) =>
                  current.filter((prize) => prize.id !== id)
                )
              }
            />
          </div>
        </>
      )}

      {activeTab === "points" && (
        <PointExchange
          balances={pointBalances}
          redemptions={ticketRedemptions}
          onAddPointRecord={handleAddPointRecord}
          onRedeemTickets={handleRedeemTickets}
        />
      )}

      {activeTab === "ledger" && (
        <PointLedger
          ledger={pointLedger}
          balances={pointBalances}
          redemptions={ticketRedemptions}
          onClearLedger={handleClearPointLedger}
        />
      )}

      {activeTab === "history" && (
        <DrawHistory
          history={history}
          onClearHistory={() => setHistory([])}
        />
      )}

      <DrawResultModal result={result} onClose={() => setResult(null)} />
    </section>
  );
}
