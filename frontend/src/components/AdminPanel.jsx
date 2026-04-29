import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI } from '../utils/contracts';
import { Coins, UserPlus, ShieldAlert, ArrowRight } from 'lucide-react';
import AccountQr from './AccountQr';

export default function AdminPanel({ accounts, wallet }) {
  const [balance, setBalance] = useState('0');
  const [contract, setContract] = useState(null);
  const [mintAmount, setMintAmount] = useState('');
  const [targetAccount, setTargetAccount] = useState(accounts.PARENT);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const adminAddress = wallet?.address || accounts.ADMIN;

  useEffect(() => {
    initContract();
  }, [wallet?.provider, wallet?.address, wallet?.refreshKey]);

  const initContract = async () => {
    try {
      const provider = wallet?.provider || new JsonRpcProvider('http://127.0.0.1:8545');
      const signer = wallet?.provider ? await provider.getSigner() : await provider.getSigner(0);
      const coinContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, signer);
      setContract(coinContract);
      
      const bal = await coinContract.balanceOf(adminAddress);
      setBalance(formatUnits(bal, 18));
    } catch (err) {
      console.error(err);
      setStatus('Failed to connect to local network.');
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!contract || !mintAmount) return;
    
    setLoading(true);
    setStatus('');
    try {
      // Transfer tokens from Admin to Target (acting as mint/distribution)
      // Since admin already minted 10k initially, we just transfer them.
      const tx = await contract.transfer(targetAccount, parseUnits(mintAmount.toString(), 18));
      await tx.wait();
      setStatus(`Successfully transferred ${mintAmount} CMP!`);
      setMintAmount('');
      initContract(); // refresh balance
    } catch (err) {
      console.error(err);
      setStatus('Transaction failed.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Finance Administration</h2>
            <p className="text-gray-500 mt-1">Manage CampusCoin liquidity and distribution</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 font-medium mb-1">Treasury Balance</p>
                <h3 className="text-3xl font-bold">{parseFloat(balance).toLocaleString()} <span className="text-lg">CMP</span></h3>
              </div>
              <Coins className="w-6 h-6 text-indigo-200" />
            </div>
            <p className="text-sm text-indigo-200 mt-4 break-all opacity-80">{adminAddress}</p>
          </div>
          <div className="md:col-span-2 flex md:justify-start">
            <AccountQr
              title="Admin Treasury"
              user="Finance Admin"
              address={adminAddress}
              amount={`${mintAmount || 0} CMP`}
              balance={`${parseFloat(balance).toLocaleString()} CMP`}
              accent="text-indigo-600"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-gray-400" />
            Distribute Tokens
          </h3>
          
          <form onSubmit={handleMint} className="bg-gray-50 p-6 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Account</label>
                <select 
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                >
                  <option value={accounts.PARENT}>Parent Account ({accounts.PARENT.substring(0,6)}...)</option>
                  <option value={accounts.STUDENT}>Student Account ({accounts.STUDENT.substring(0,6)}...)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (CMP)</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="e.g. 500"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 flex items-center justify-center w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Transfer Tokens'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
            
            {status && (
              <div className={`p-3 rounded-lg text-sm font-medium mt-4 ${status.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {status}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
