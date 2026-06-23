export const POINT_LEDGER_KEY = "xiaoxiaoyuan-point-ledger";
export const POINT_BALANCES_KEY = "xiaoxiaoyuan-point-balances";
export const TICKET_REDEMPTIONS_KEY = "xiaoxiaoyuan-ticket-redemptions";

export const TICKET_POINT_COST = 100;

const toNumber = (value) => Math.max(0, Number(value) || 0);

export const calculateYoutubePoints = ({
  likes,
  checkins,
  donationAmount,
  isMember,
}) =>
  toNumber(likes) * 1 +
  toNumber(checkins) * 5 +
  toNumber(donationAmount) * 1 +
  (isMember ? 100 : 0);

export const calculateTwitchPoints = ({
  checkins,
  loyaltyPoints,
  donationAmount,
  giftedSubs,
}) =>
  toNumber(checkins) * 5 +
  Math.floor(toNumber(loyaltyPoints) / 100) +
  toNumber(donationAmount) * 1 +
  toNumber(giftedSubs) * 100;

export const calculateGiftPoints = ({ giftPoints }) => toNumber(giftPoints);

export const applyPointRecord = (balances, record) => ({
  ...balances,
  [record.viewerName]: toNumber(balances[record.viewerName]) + record.points,
});

export const applyTicketRedemption = (balances, viewerName, ticketCount) => {
  const cost = ticketCount * TICKET_POINT_COST;

  return {
    ...balances,
    [viewerName]: toNumber(balances[viewerName]) - cost,
  };
};

export const getRanking = (balances) =>
  Object.entries(balances)
    .map(([viewerName, points]) => ({
      viewerName,
      points: toNumber(points),
    }))
    .sort((a, b) => b.points - a.points || a.viewerName.localeCompare(b.viewerName));
