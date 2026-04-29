export default function AccountQr({
  title,
  user,
  address,
  amount = '0 CMP',
  balance = '0 CMP',
  details = {},
  accent = 'text-gray-900',
}) {
  const qrDetails = [
    `User: ${user}`,
    details.studentId ? `Student ID: ${details.studentId}` : null,
    details.cardNumber ? `Card Number: ${details.cardNumber}` : null,
    details.validity ? `Valid: ${details.validity}` : null,
    `Account: ${address}`,
    `Transfer Amount: ${amount}`,
    `Remaining Balance: ${balance}`,
  ].filter(Boolean).join('\n');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=18&data=${encodeURIComponent(qrDetails)}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 max-w-[220px]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-900">{title} QR</p>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <span className={`text-xs font-semibold ${accent}`}>CMP</span>
      </div>

      <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
        <img
          src={qrUrl}
          alt={`${title} account QR code`}
          className="w-full aspect-square rounded-lg bg-white"
        />
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-500">
        <p className="font-medium text-gray-700">{user}</p>
        <p>Amount: {amount}</p>
        <p>Balance: {balance}</p>
      </div>
    </div>
  );
}
