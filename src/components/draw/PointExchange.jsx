import { useState } from "react";
import {
  calculateGiftPoints,
  calculateTwitchPoints,
  calculateYoutubePoints,
} from "../../utils/pointUtils";
import PointRanking from "./PointRanking";
import TicketRedemption from "./TicketRedemption";

const giftReasons = [
  "當月斗內最高者",
  "當月仍是訂閱會員",
  "小小源評選",
  "特殊活動補發",
  "手動贈點",
];

const initialYoutube = {
  viewerName: "",
  likes: 0,
  checkins: 0,
  donationAmount: 0,
  isMember: false,
  note: "",
};

const initialTwitch = {
  viewerName: "",
  checkins: 0,
  loyaltyPoints: 0,
  donationAmount: 0,
  giftedSubs: 0,
  note: "",
};

const initialGift = {
  viewerName: "",
  reason: giftReasons[0],
  giftPoints: 0,
  note: "",
};

export default function PointExchange({
  balances,
  redemptions,
  onAddPointRecord,
  onRedeemTickets,
}) {
  const [youtube, setYoutube] = useState(initialYoutube);
  const [twitch, setTwitch] = useState(initialTwitch);
  const [gift, setGift] = useState(initialGift);
  const [message, setMessage] = useState("");

  const submitRecord = (record, reset) => {
    if (!record.viewerName.trim()) {
      setMessage("觀眾名稱不能空白。");
      return;
    }

    if (record.points <= 0) {
      setMessage("換算後點數必須大於 0。");
      return;
    }

    onAddPointRecord(record);
    reset();
    setMessage(`已新增 ${record.viewerName.trim()} 的 ${record.points} 點。`);
  };

  const handleYoutubeSubmit = (event) => {
    event.preventDefault();
    const points = calculateYoutubePoints(youtube);

    submitRecord(
      {
        viewerName: youtube.viewerName.trim(),
        platform: "YouTube",
        sourceType: youtube.isMember ? "YouTube 點數 / 會員" : "YouTube 點數",
        rawAmount: `按讚 ${youtube.likes}、簽到 ${youtube.checkins}、斗內 ${youtube.donationAmount}、會員 ${
          youtube.isMember ? "是" : "否"
        }`,
        points,
        note: youtube.note.trim(),
      },
      () => setYoutube(initialYoutube)
    );
  };

  const handleTwitchSubmit = (event) => {
    event.preventDefault();
    const points = calculateTwitchPoints(twitch);

    submitRecord(
      {
        viewerName: twitch.viewerName.trim(),
        platform: "Twitch",
        sourceType: "Twitch 點數",
        rawAmount: `簽到 ${twitch.checkins}、忠誠度 ${twitch.loyaltyPoints}、斗內 ${twitch.donationAmount}、贈訂 ${twitch.giftedSubs}`,
        points,
        note: twitch.note.trim(),
      },
      () => setTwitch(initialTwitch)
    );
  };

  const handleGiftSubmit = (event) => {
    event.preventDefault();
    const points = calculateGiftPoints(gift);

    submitRecord(
      {
        viewerName: gift.viewerName.trim(),
        platform: "活動贈送點數",
        sourceType: gift.reason,
        rawAmount: `贈送點數 ${gift.giftPoints}`,
        points,
        note: gift.note.trim(),
      },
      () => setGift(initialGift)
    );
  };

  return (
    <div className="pointExchangeLayout">
      <section className="drawPanel">
        <div className="drawPanelHeader">
          <div>
            <p className="drawKicker">Points</p>
            <h3>點數兌換</h3>
            <span className="pointDevBadge">點數兌換為自動代入（研發中）</span>
          </div>
        </div>

        {message && <div className="drawAlert">{message}</div>}

        <div className="pointSourceList">
          <form className="pointForm" onSubmit={handleYoutubeSubmit}>
            <h4>YouTube 點數</h4>
            <label>
              觀眾名稱
              <input
                value={youtube.viewerName}
                onChange={(event) =>
                  setYoutube((current) => ({
                    ...current,
                    viewerName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              按讚次數
              <input
                min="0"
                type="number"
                value={youtube.likes}
                onChange={(event) =>
                  setYoutube((current) => ({ ...current, likes: event.target.value }))
                }
              />
            </label>
            <label>
              簽到次數
              <input
                min="0"
                type="number"
                value={youtube.checkins}
                onChange={(event) =>
                  setYoutube((current) => ({
                    ...current,
                    checkins: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              斗內金額
              <input
                min="0"
                type="number"
                value={youtube.donationAmount}
                onChange={(event) =>
                  setYoutube((current) => ({
                    ...current,
                    donationAmount: event.target.value,
                  }))
                }
              />
            </label>
            <label className="drawCheckRow">
              <input
                type="checkbox"
                checked={youtube.isMember}
                onChange={(event) =>
                  setYoutube((current) => ({
                    ...current,
                    isMember: event.target.checked,
                  }))
                }
              />
              是否為會員
            </label>
            <label>
              備註
              <textarea
                rows="2"
                value={youtube.note}
                onChange={(event) =>
                  setYoutube((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>
            <strong className="pointPreview">
              換算：{calculateYoutubePoints(youtube)} 點
            </strong>
            <button type="submit">新增 YouTube 點數</button>
          </form>

          <form className="pointForm" onSubmit={handleTwitchSubmit}>
            <h4>Twitch 點數</h4>
            <label>
              觀眾名稱
              <input
                value={twitch.viewerName}
                onChange={(event) =>
                  setTwitch((current) => ({
                    ...current,
                    viewerName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              簽到次數
              <input
                min="0"
                type="number"
                value={twitch.checkins}
                onChange={(event) =>
                  setTwitch((current) => ({
                    ...current,
                    checkins: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              忠誠度點數
              <input
                min="0"
                type="number"
                value={twitch.loyaltyPoints}
                onChange={(event) =>
                  setTwitch((current) => ({
                    ...current,
                    loyaltyPoints: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              斗內金額
              <input
                min="0"
                type="number"
                value={twitch.donationAmount}
                onChange={(event) =>
                  setTwitch((current) => ({
                    ...current,
                    donationAmount: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              贈送訂閱數
              <input
                min="0"
                type="number"
                value={twitch.giftedSubs}
                onChange={(event) =>
                  setTwitch((current) => ({
                    ...current,
                    giftedSubs: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              備註
              <textarea
                rows="2"
                value={twitch.note}
                onChange={(event) =>
                  setTwitch((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>
            <strong className="pointPreview">
              換算：{calculateTwitchPoints(twitch)} 點
            </strong>
            <button type="submit">新增 Twitch 點數</button>
          </form>

          <form className="pointForm" onSubmit={handleGiftSubmit}>
            <h4>活動贈送點數</h4>
            <label>
              觀眾名稱
              <input
                value={gift.viewerName}
                onChange={(event) =>
                  setGift((current) => ({
                    ...current,
                    viewerName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              贈點原因
              <select
                value={gift.reason}
                onChange={(event) =>
                  setGift((current) => ({ ...current, reason: event.target.value }))
                }
              >
                {giftReasons.map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
            </label>
            <label>
              贈送點數
              <input
                min="0"
                type="number"
                value={gift.giftPoints}
                onChange={(event) =>
                  setGift((current) => ({
                    ...current,
                    giftPoints: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              備註
              <textarea
                rows="2"
                value={gift.note}
                onChange={(event) =>
                  setGift((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>
            <strong className="pointPreview">
              換算：{calculateGiftPoints(gift)} 點
            </strong>
            <button type="submit">新增活動贈送點數</button>
          </form>
        </div>
      </section>

      <div className="pointSideStack">
        <PointRanking balances={balances} />
        <TicketRedemption
          balances={balances}
          redemptions={redemptions}
          onRedeemTickets={onRedeemTickets}
        />
      </div>
    </div>
  );
}
