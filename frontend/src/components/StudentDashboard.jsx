import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI } from '../utils/contracts';
import { CreditCard, Send, Wallet } from 'lucide-react';
import AccountQr from './AccountQr';
import { addTransaction } from '../utils/transactionHistory';

export default function StudentDashboard({ accounts, wallet }) {
  const [balance, setBalance] = useState('0');
  const [cardBalance, setCardBalance] = useState('0');
  const [contract, setContract] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const studentAddress = wallet?.address || accounts.STUDENT;

  useEffect(() => {
    initContract();
  }, [wallet?.provider, wallet?.address, wallet?.refreshKey]);

  const initContract = async () => {
    try {
      const provider = wallet?.provider || new JsonRpcProvider('http://127.0.0.1:8545');
      const signer = wallet?.provider ? await provider.getSigner() : await provider.getSigner(2);
      const coinContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, signer);
      setContract(coinContract);

      const studentBal = await coinContract.balanceOf(studentAddress);
      const cardBal = await coinContract.balanceOf(accounts.STUDENT_CARD);
      setBalance(formatUnits(studentBal, 18));
      setCardBalance(formatUnits(cardBal, 18));
    } catch (err) {
      console.error(err);
      setStatus('Failed to connect to local network.');
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!contract || !topupAmount) return;

    if (parseFloat(topupAmount) > parseFloat(balance)) {
      setStatus('Transfer failed. Student wallet has insufficient balance.');
      return;
    }

    setLoading(true);
    setStatus('');
    try {
      const tx = await contract.transfer(accounts.STUDENT_CARD, parseUnits(topupAmount.toString(), 18));
      await tx.wait();
      addTransaction({
        type: 'Credit',
        actor: 'Student',
        description: 'Student loaded Student Card',
        amount: `+${topupAmount} CMP`,
      });
      setStatus(`Successfully transferred ${topupAmount} CMP to Student Card.`);
      setTopupAmount('');
      initContract();
    } catch (err) {
      console.error(err);
      setStatus('Transfer failed.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Wallet</h2>
            <p className="text-gray-500 mt-1">Move money from the student wallet into the student card</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Wallet className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
            <p className="text-emerald-600 font-medium mb-1">Student Wallet Balance</p>
            <h3 className="text-3xl font-bold text-emerald-900">{parseFloat(balance).toLocaleString()} CMP</h3>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <p className="text-slate-600 font-medium mb-1">Student Card Balance</p>
            <h3 className="text-3xl font-bold text-slate-900">{parseFloat(cardBalance).toLocaleString()} CMP</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6 items-start">
          <form onSubmit={handleTopup} className="bg-gray-50 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Send className="w-5 h-5 mr-2 text-emerald-500" />
              Transfer to Student Card
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">CMP</span>
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                className="pl-14 w-full text-lg rounded-xl border-gray-300 border py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Amount to load"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? 'Transferring...' : 'Load Student Card'}
            </button>
            {status && (
              <div className={`p-3 rounded-lg text-sm font-medium ${status.includes('failed') || status.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status}
              </div>
            )}
          </form>

          <AccountQr
            title="Student Card"
            user="Student Card"
            address={accounts.STUDENT_CARD}
            amount={`${topupAmount || 0} CMP top-up`}
            balance={`${parseFloat(cardBalance).toLocaleString()} CMP`}
            accent="text-emerald-600"
          />
        </div>
      </div>
    </div>
  );
}
