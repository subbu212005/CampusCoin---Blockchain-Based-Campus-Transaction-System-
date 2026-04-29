import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI } from '../utils/contracts';
import { Wallet, Settings, Send, AlertCircle } from 'lucide-react';
import AccountQr from './AccountQr';
import { addTransaction } from '../utils/transactionHistory';

export default function ParentDashboard({ accounts, wallet }) {
  const [balance, setBalance] = useState('0');
  const [cardBalance, setCardBalance] = useState('0');
  const [contract, setContract] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [dailyLimit, setDailyLimit] = useState('50');
  const parentAddress = wallet?.address || accounts.PARENT;

  useEffect(() => {
    initContract();
  }, [wallet?.provider, wallet?.address, wallet?.refreshKey]);

  const initContract = async () => {
    try {
      const provider = wallet?.provider || new JsonRpcProvider('http://127.0.0.1:8545');
      const signer = wallet?.provider ? await provider.getSigner() : await provider.getSigner(1); 
      const coinContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, signer);
      setContract(coinContract);
      
      const bal = await coinContract.balanceOf(parentAddress);
      setBalance(formatUnits(bal, 18));
      
      const cardBal = await coinContract.balanceOf(accounts.STUDENT_CARD);
      setCardBalance(formatUnits(cardBal, 18));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!contract || !topupAmount) return;
    
    setLoading(true);
    setStatus('');
    try {
      const tx = await contract.transfer(accounts.STUDENT_CARD, parseUnits(topupAmount.toString(), 18));
      await tx.wait();
      addTransaction({
        type: 'Credit',
        actor: 'Parent',
        description: 'Parent loaded Student Card',
        amount: `+${topupAmount} CMP`,
      });
      setStatus(`Successfully loaded ${topupAmount} CMP onto the Student Card!`);
      setTopupAmount('');
      initContract();
    } catch (err) {
      console.error(err);
      setStatus('Transfer failed. Make sure you have enough balance.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Parent Dashboard</h2>
            
            <div className="grid grid-cols-1 gap-4 mb-8">
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10 text-emerald-600">
                  <Wallet className="w-24 h-24" />
                </div>
                <p className="text-emerald-600 font-medium mb-1 relative z-10">Student Card Balance</p>
                <h3 className="text-3xl font-bold text-emerald-900 relative z-10">{parseFloat(cardBalance).toLocaleString()} CMP</h3>
              </div>
            </div>

            <div className="mb-8">
              <AccountQr
                title="Student Card"
                user="Student Card"
                address={accounts.STUDENT_CARD}
                amount={`${topupAmount || 0} CMP parent top-up`}
                balance={`${parseFloat(cardBalance).toLocaleString()} CMP`}
                accent="text-blue-600"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Send className="w-5 h-5 mr-2 text-blue-500" />
                Top-up Student Card
              </h3>
              
              <form onSubmit={handleTopup} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">CMP</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    className="pl-12 w-full rounded-xl border-gray-300 border py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Amount to send"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center"
                >
                  {loading ? 'Sending...' : 'Send Funds'}
                </button>
              </form>
              
              {status && (
                <div className={`p-3 rounded-lg text-sm font-medium mt-4 ${status.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-400" />
              Controls (Simulation)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Spend Limit</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">CMP</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-1 inline shrink-0" />
                  Limits are enforced by the frontend DApp for this demo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
