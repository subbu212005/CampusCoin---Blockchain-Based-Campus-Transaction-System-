import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, parseUnits } from 'ethers';
import { CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI } from './utils/contracts';
import { CreditCard, Wallet, Users, Coffee, LogOut, PlugZap, CircleDollarSign, ShieldAlert } from 'lucide-react';
import ParentDashboard from './components/ParentDashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentWallet from './components/StudentWallet';
import CanteenDashboard from './components/CanteenDashboard';
import AdminPanel from './components/AdminPanel';

// Hardhat local node default accounts
const ACCOUNTS = {
  ADMIN: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account #0 (Owner)
  PARENT: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
  STUDENT: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
  CANTEEN: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3
  STUDENT_CARD: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" // Account #4
};

function App() {
  const [activeRole, setActiveRole] = useState(null); // 'STUDENT', 'PARENT', 'CANTEEN', 'CARD'
  const [walletProvider, setWalletProvider] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletStatus, setWalletStatus] = useState('');
  const [funding, setFunding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      setWalletAddress(accounts[0] || '');
      setWalletProvider(accounts[0] ? new BrowserProvider(window.ethereum) : null);
    };

    window.ethereum.request({ method: 'eth_accounts' }).then(handleAccountsChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setWalletStatus('MetaMask is not installed.');
      return;
    }

    setWalletStatus('');
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7a69',
            chainName: 'Hardhat Localhost',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['http://127.0.0.1:8545'],
          }],
        });
      } else {
        console.error(switchError);
      }
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0] || '');
      setWalletProvider(new BrowserProvider(window.ethereum));
    } catch (err) {
      console.error(err);
      setWalletStatus('MetaMask connection was rejected.');
    }
  };

  const fundWallet = async () => {
    if (!walletAddress) {
      setWalletStatus('Connect MetaMask before funding your wallet.');
      return;
    }

    setFunding(true);
    setWalletStatus('');
    try {
      const localProvider = new JsonRpcProvider('http://127.0.0.1:8545');
      await localProvider.send('hardhat_setBalance', [
        walletAddress,
        '0x56BC75E2D63100000',
      ]);

      const treasurySigner = await localProvider.getSigner(0);
      const coinContract = new Contract(CAMPUS_COIN_ADDRESS, CAMPUS_COIN_ABI, treasurySigner);
      const tx = await coinContract.transfer(walletAddress, parseUnits('500', 18));
      await tx.wait();

      setRefreshKey((key) => key + 1);
      setWalletStatus('Funded MetaMask wallet with 500 CMP and demo ETH.');
    } catch (err) {
      console.error(err);
      setWalletStatus('Funding failed. Make sure the Hardhat node is running on 127.0.0.1:8545.');
    }
    setFunding(false);
  };

  const wallet = { provider: walletProvider, address: walletAddress, refreshKey };

  const renderContent = () => {
    switch (activeRole) {
      case 'STUDENT': return <StudentDashboard accounts={ACCOUNTS} wallet={wallet} />;
      case 'PARENT': return <ParentDashboard accounts={ACCOUNTS} wallet={wallet} />;
      case 'CANTEEN': return <CanteenDashboard accounts={ACCOUNTS} wallet={wallet} />;
      case 'CARD': return <StudentWallet accounts={ACCOUNTS} wallet={wallet} />;
      case 'ADMIN': return <AdminPanel accounts={ACCOUNTS} wallet={wallet} />;
      default: return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Select Your Role</h2>
            <p className="text-gray-500">Choose a persona to simulate the CampusCoin ecosystem</p>
            {walletStatus && <p className="text-sm text-red-600">{walletStatus}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl w-full">
            <RoleCard icon={<Wallet className="w-8 h-8"/>} title="Student" role="STUDENT" onClick={() => setActiveRole('STUDENT')} color="bg-emerald-50 hover:bg-emerald-100 text-emerald-700" />
            <RoleCard icon={<Users className="w-8 h-8"/>} title="Parent" role="PARENT" onClick={() => setActiveRole('PARENT')} color="bg-blue-50 hover:bg-blue-100 text-blue-700" />
            <RoleCard icon={<Coffee className="w-8 h-8"/>} title="Canteen Staff" role="CANTEEN" onClick={() => setActiveRole('CANTEEN')} color="bg-amber-50 hover:bg-amber-100 text-amber-700" />
            <RoleCard icon={<CreditCard className="w-8 h-8"/>} title="Student Card" role="CARD" onClick={() => setActiveRole('CARD')} color="bg-slate-50 hover:bg-slate-100 text-slate-700" />
            <RoleCard icon={<ShieldAlert className="w-8 h-8"/>} title="Finance Admin" role="ADMIN" onClick={() => setActiveRole('ADMIN')} color="bg-indigo-50 hover:bg-indigo-100 text-indigo-700" />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveRole(null)}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">CampusCoin</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={connectWallet}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              title="Connect MetaMask"
            >
              <PlugZap className="w-4 h-4" />
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect MetaMask'}
            </button>

            {walletAddress && (
              <button
                onClick={fundWallet}
                disabled={funding}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                title="Fund connected MetaMask wallet"
              >
                <CircleDollarSign className="w-4 h-4" />
                {funding ? 'Funding...' : 'Fund Wallet'}
              </button>
            )}

            {activeRole && (
              <>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                {activeRole.toLowerCase()} View
              </span>
              <button 
                onClick={() => setActiveRole(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2"
                title="Switch Role"
              >
                <LogOut className="w-5 h-5" />
              </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {walletStatus && (
          <div className="max-w-7xl mx-auto mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            {walletStatus}
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

function RoleCard({ icon, title, onClick, color }) {
  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-2xl border border-transparent shadow-sm transition-all duration-200 flex flex-col items-center justify-center space-y-4 ${color}`}
    >
      <div className="p-4 bg-white rounded-xl shadow-sm">
        {icon}
      </div>
      <span className="font-semibold text-lg">{title}</span>
    </button>
  );
}

export default App;
