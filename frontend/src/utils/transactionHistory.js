const HISTORY_KEY = 'campuscoin_card_transactions';

export function getTransactionHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addTransaction(entry) {
  const history = getTransactionHistory();
  const nextHistory = [
    {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      ...entry,
    },
    ...history,
  ].slice(0, 20);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  window.dispatchEvent(new Event('card-history-updated'));
  return nextHistory;
}
