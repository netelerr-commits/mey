import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Onboarding from '../components/Onboarding';
import { ListChecks, Package, Wallet, Plus, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const handleOnboardingComplete = async () => {
    await refreshProfile();
    setShowOnboarding(false);
  };

  const stats = {
    lista: { completed: 7, total: 15 },
    dispensa: { inStock: 23, outOfStock: 5 },
    financeiro: { spent: 850 }
  };

  const progressPercentage = (stats.lista.completed / stats.lista.total) * 100;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">
            Bem-vinda, {profile?.name || 'Usuária'}!
          </h1>
          <p className="text-gray-600 text-lg">
            Organize hoje, viva melhor amanhã.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#ffcc00]/10 p-3 rounded-xl">
                <ListChecks className="w-6 h-6 text-[#ffcc00]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Lista Atual</h3>
            <p className="text-3xl font-bold text-black mb-1">
              <span className="text-[#ffcc00]">{stats.lista.completed}</span>/{stats.lista.total}
            </p>
            <p className="text-sm text-gray-500">itens concluídos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#ffcc00]/10 p-3 rounded-xl">
                <Package className="w-6 h-6 text-[#ffcc00]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Dispensa</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-xl font-bold text-black">
                Em estoque: <span className="text-[#ffcc00]">{stats.dispensa.inStock}</span>
              </p>
            </div>
            <p className="text-sm text-gray-500">Em falta: {stats.dispensa.outOfStock}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#ffcc00]/10 p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-[#ffcc00]" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Financeiro</h3>
            <p className="text-3xl font-bold text-black mb-1">
              R$ <span className="text-[#ffcc00]">{stats.financeiro.spent}</span>
            </p>
            <p className="text-sm text-gray-500">Gasto em outubro</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Progresso do Dia de Compra</h3>
            <span className="text-2xl font-bold text-[#ffcc00]">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#ffcc00] to-[#ffd400] h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 10 && (
                <TrendingUp className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.lista.completed} de {stats.lista.total} itens comprados
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/listas')}
              className="flex items-center gap-3 p-4 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition-colors group"
            >
              <div className="bg-white/20 p-2 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-medium">Criar nova lista</span>
            </button>

            <button
              onClick={() => navigate('/dia-compra')}
              className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-black rounded-xl transition-colors"
            >
              <div className="bg-[#ffcc00]/10 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-[#ffcc00]" />
              </div>
              <span className="font-medium">Ir para Dia de Compra</span>
            </button>

            <button
              onClick={() => navigate('/dispensa')}
              className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-black rounded-xl transition-colors"
            >
              <div className="bg-[#ffcc00]/10 p-2 rounded-lg">
                <Package className="w-5 h-5 text-[#ffcc00]" />
              </div>
              <span className="font-medium">Adicionar à Dispensa</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
