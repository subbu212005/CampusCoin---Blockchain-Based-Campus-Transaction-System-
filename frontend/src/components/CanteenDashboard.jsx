import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI } from '../utils/contracts';
import { Coffee, TrendingUp, Users, Clock, ScanLine } from 'lucide-react';
import AccountQr from './AccountQr';
import { addTransaction } from '../utils/transactionHistory';

const CARD_DETAILS = {
  name: 'Subbu Kumar',
  studentId: 'STU-2023-1042',
  validity: 'July 23 - July 27',
  cardNumber: '4827 1936 5408',
};

export default function CanteenDashboard({ accounts, wallet }) {
  const [balance, setBalance] = useState('0');
  const [cardBalance, setCardBalance] = useState('0');
  const [billAmount, setBillAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const canteenAddress = accounts.CANTEEN;

  useEffect(() => {
    initContract();
  }, [wallet?.provider, wallet?.address, wallet?.refreshKey]);

  useEffect(() => {
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (contract) fetchBalance(contract);
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [contract]);

  const initContract = async () => {
    try {
      const provider = wallet?.provider || new JsonRpcProvider('http://127.0.0.1:8545');
      const signer = wallet?.provider ? await provider.getSigner() : await provider.getSigner(3); 
      const coinContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, signer);
      setContract(coinContract);
      
      fetchBalance(coinContract);
      fetchCardBalance(coinContract);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBalance = async (coinContract) => {
    try {
      const bal = await coinContract.balanceOf(canteenAddress);
      setBalance(formatUnits(bal, 18));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCardBalance = async (coinContract) => {
    try {
      const bal = await coinContract.balanceOf(accounts.STUDENT_CARD);
      setCardBalance(formatUnits(bal, 18));
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanAndDebit = async (e) => {
    e.preventDefault();
    if (!billAmount) return;

    if (parseFloat(billAmount) > parseFloat(cardBalance)) {
      setStatus('Payment failed. Student Card has insufficient balance.');
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      const provider = new JsonRpcProvider('http://127.0.0.1:8545');
      const cardSigner = await provider.getSigner(4);
      const cardContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, cardSigner);
      const tx = await cardContract.transfer(accounts.CANTEEN, parseUnits(billAmount.toString(), 18));
      await tx.wait();
      addTransaction({
        type: 'Debit',
        actor: 'Canteen Staff',
        description: 'Bill paid to canteen',
        amount: `-${billAmount} CMP`,
      });
      setStatus(`Bill paid: ${billAmount} CMP debited from Student Card to Canteen.`);
      setBillAmount('');
      fetchBalance(contract || cardContract);
      fetchCardBalance(contract || cardContract);
    } catch (err) {
      console.error(err);
      setStatus('Payment failed. Make sure the Hardhat card account is available.');
    }
    setLoading(false);
  };

  // Mock stats for demo
  const txCount = parseFloat(balance) > 0 ? Math.floor(parseFloat(balance) / 15) : 0; // rough avg of 15 CMP per meal
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Canteen Terminal</h2>
          <p className="text-gray-500">Real-time revenue & transaction monitoring</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200 shadow-sm">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          System Online
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden md:col-span-2">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <Coffee className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <p className="text-amber-100 font-medium text-lg mb-2 flex items-center">
              Total Revenue Today
            </p>
            <h3 className="text-6xl font-bold mb-4 tracking-tight">
              {parseFloat(balance).toLocaleString()} <span className="text-3xl font-normal opacity-80">CMP</span>
            </h3>
            <div className="flex items-center text-sm font-medium bg-white/20 inline-flex px-3 py-1 rounded-full backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Real-time settlement
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-gray-500 font-medium">Meals Served</p>
            <h3 className="text-4xl font-bold text-gray-900 mt-1">{txCount}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Updated just now
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6 items-start">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ScanLine className="w-5 h-5 mr-2 text-amber-500" />
            Scan Student Card and Pay Bill
          </h3>
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Student Card Balance</span>
            <span className="font-semibold text-slate-900">{parseFloat(cardBalance).toLocaleString()} CMP</span>
          </div>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-xs text-gray-500 mb-1">Student Name</p>
              <p className="font-semibold text-gray-900">{CARD_DETAILS.name}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-xs text-gray-500 mb-1">Student ID</p>
              <p className="font-mono text-gray-900">{CARD_DETAILS.studentId}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-xs text-gray-500 mb-1">Valid</p>
              <p className="font-semibold text-gray-900">{CARD_DETAILS.validity}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-xs text-gray-500 mb-1">Card Number</p>
              <p className="font-mono text-gray-900">{CARD_DETAILS.cardNumber}</p>
            </div>
          </div>
          <form onSubmit={handleScanAndDebit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">CMP</span>
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                className="pl-14 w-full text-lg rounded-xl border-gray-300 border py-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Bill amount"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? 'Debiting...' : 'Scan Card and Debit'}
            </button>
          </form>
          {status && (
            <div className={`p-3 rounded-lg text-sm font-medium mt-4 ${status.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {status}
            </div>
          )}
        </div>

        <AccountQr
          title="Student Card"
          user={CARD_DETAILS.name}
          address={accounts.STUDENT_CARD}
          amount={`${billAmount || 0} CMP bill`}
          balance={`${parseFloat(cardBalance).toLocaleString()} CMP`}
          details={CARD_DETAILS}
          accent="text-amber-600"
        />
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h3>
        {parseFloat(balance) === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Waiting for first payment...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mock recent transaction based on balance */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Received</p>
                  <p className="text-xs text-gray-500 font-mono">From card: {accounts.STUDENT_CARD.slice(0,8)}...{accounts.STUDENT_CARD.slice(-4)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+ CMP</p>
                <p className="text-xs text-gray-400">Just now</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
