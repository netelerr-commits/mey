import { Wallet } from 'lucide-react';

export default function Financeiro() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#ffcc00] p-3 rounded-xl">
            <Wallet className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black">Financeiro</h1>
        </div>
        <p className="text-gray-600">
          Acompanhe seus gastos com alimentação e economize.
        </p>
      </div>
    </div>
  );
}
