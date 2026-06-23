export const normalizePrizes = (prizes) => {
  if (!Array.isArray(prizes)) return [];

  return prizes.map((prize) => ({
    id: prize.id || crypto.randomUUID(),
    name: String(prize.name || "").trim(),
    tier: String(prize.tier || "普通獎").trim() || "普通獎",
    quantity: Math.max(0, Number(prize.quantity) || 0),
    isGrand: Boolean(prize.isGrand),
  }));
};

export const getTotalRemaining = (prizes) =>
  normalizePrizes(prizes).reduce((total, prize) => total + prize.quantity, 0);

export const drawPrize = (prizes, randomValue = Math.random()) => {
  const availablePrizes = normalizePrizes(prizes).filter(
    (prize) => prize.quantity > 0
  );
  const totalWeight = availablePrizes.reduce(
    (total, prize) => total + prize.quantity,
    0
  );

  if (totalWeight <= 0) return null;

  let ticket = randomValue * totalWeight;

  for (const prize of availablePrizes) {
    ticket -= prize.quantity;
    if (ticket < 0) return prize;
  }

  return availablePrizes.at(-1) || null;
};
