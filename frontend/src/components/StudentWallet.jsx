import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI } from '../utils/contracts';
import { CreditCard, History, TrendingDown, TrendingUp } from 'lucide-react';
import AccountQr from './AccountQr';
import { getTransactionHistory } from '../utils/transactionHistory';

const CARD_DETAILS = {
  name: 'Subbu Kumar',
  studentId: 'STU-2023-1042',
  validity: 'July 23 - July 27',
  cardNumber: '4827 1936 5408',
};

export default function StudentWallet({ accounts, wallet }) {
  const [cardBalance, setCardBalance] = useState('0');
  const [history, setHistory] = useState([]);
  const [activePanel, setActivePanel] = useState('balance');
  const cardAddress = accounts.STUDENT_CARD;
  const cardQrDetails = [
    `User: ${CARD_DETAILS.name}`,
    `Student ID: ${CARD_DETAILS.studentId}`,
    `Card Number: ${CARD_DETAILS.cardNumber}`,
    `Valid: ${CARD_DETAILS.validity}`,
    `Account: ${cardAddress}`,
    `Remaining Balance: ${parseFloat(cardBalance).toLocaleString()} CMP`,
  ].join('\n');
  const cardQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(cardQrDetails)}`;

  useEffect(() => {
    fetchCardBalance();
    setHistory(getTransactionHistory());
  }, [wallet?.refreshKey]);

  useEffect(() => {
    const syncHistory = () => setHistory(getTransactionHistory());
    window.addEventListener('card-history-updated', syncHistory);
    return () => window.removeEventListener('card-history-updated', syncHistory);
  }, []);

  const fetchCardBalance = async () => {
    try {
      const provider = new JsonRpcProvider('http://127.0.0.1:8545');
      const coinContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, provider);
      const bal = await coinContract.balanceOf(cardAddress);
      setCardBalance(formatUnits(bal, 18));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6 items-start">
        <div className="bg-gradient-to-b from-slate-800 to-slate-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-emerald-400 opacity-10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-medium opacity-90">Student Card</h2>
                <p className="text-sm opacity-70 mt-1">Vignan University</p>
              </div>
              <CreditCard className="w-8 h-8 opacity-80" />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-5 items-end">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs opacity-70 mb-1">Name</p>
                  <p className="font-semibold">{CARD_DETAILS.name}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 mb-1">Student ID</p>
                  <p className="font-mono">{CARD_DETAILS.studentId}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 mb-1">Valid</p>
                  <p className="font-semibold">{CARD_DETAILS.validity}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 mb-1">Card Number</p>
                  <p className="font-mono">{CARD_DETAILS.cardNumber}</p>
                </div>
              </div>

              <div className="bg-white p-2 rounded-xl shadow-sm">
                <img
                  src={cardQrUrl}
                  alt="Student card QR code"
                  className="w-24 h-24 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <AccountQr
          title="Student Card"
          user={CARD_DETAILS.name}
          address={cardAddress}
          amount="Scan for canteen payment"
          balance={`${parseFloat(cardBalance).toLocaleString()} CMP`}
          details={CARD_DETAILS}
          accent="text-slate-700"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan Card to Pay</h3>
        <p className="text-gray-500">
          The canteen scans this card QR, enters the bill amount, and the amount is debited from this card account to the canteen account.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setActivePanel('balance')}
          className={`px-5 py-3 rounded-xl font-semibold transition-colors ${activePanel === 'balance' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'}`}
        >
          Check Balance
        </button>
        <button
          onClick={() => setActivePanel('history')}
          className={`px-5 py-3 rounded-xl font-semibold transition-colors ${activePanel === 'history' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'}`}
        >
          Check History
        </button>
      </div>

      {activePanel === 'balance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Student Card Balance</p>
          <h3 className="text-4xl font-bold text-slate-900">
            {parseFloat(cardBalance).toLocaleString()} <span className="text-xl font-normal text-gray-500">CMP</span>
          </h3>
        </div>
      )}

      {activePanel === 'history' && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <History className="w-5 h-5 mr-2 text-slate-500" />
          Student Card Transaction History
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-xl">
            <p>No card transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const isCredit = item.type === 'Credit';
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isCredit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.actor} - {item.date}</p>
                    </div>
                  </div>
                  <p className={`font-bold whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {item.amount}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
