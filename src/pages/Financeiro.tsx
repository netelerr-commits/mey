import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShoppingBag,
  Filter,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Plus
} from 'lucide-react';

type Purchase = {
  id: string;
  name: string;
  total_amount: number;
  item_count: number;
  purchase_date: string;
  notes: string;
};

type MonthlyData = {
  month: string;
  total: number;
};

export default function Financeiro() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user?.id)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .order('purchase_date', { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

      const { data: settings } = await supabase
        .from('financial_settings')
        .select('monthly_budget')
        .eq('user_id', user?.id)
        .maybeSingle();

      setMonthlyBudget(settings?.monthly_budget || null);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetInput) return;

    try {
      const budget = parseFloat(budgetInput);

      const { data: existing } = await supabase
        .from('financial_settings')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('financial_settings')
          .update({ monthly_budget: budget })
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('financial_settings')
          .insert([
            {
              user_id: user?.id,
              monthly_budget: budget
            }
          ]);
      }

      setMonthlyBudget(budget);
      setShowBudgetModal(false);
      setBudgetInput('');
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const getCurrentMonthTotal = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
  };

  const getPreviousMonthTotal = async () => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const startDate = new Date(prevYear, prevMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('purchases')
      .select('total_amount')
      .eq('user_id', user?.id)
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate);

    return (data || []).reduce((sum, p) => sum + p.total_amount, 0);
  };

  const getLast6MonthsData = async (): Promise<MonthlyData[]> => {
    const monthsData: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('user_id', user?.id)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

      const total = (data || []).reduce((sum, p) => sum + p.total_amount, 0);

      monthsData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        total
      });
    }

    return monthsData;
  };

  const [previousTotal, setPreviousTotal] = useState(0);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (user) {
      getPreviousMonthTotal().then(setPreviousTotal);
      getLast6MonthsData().then(setChartData);
    }
  }, [user, selectedMonth, selectedYear]);

  const currentTotal = getCurrentMonthTotal();
  const difference = currentTotal - previousTotal;
  const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0;
  const budgetPercentage = monthlyBudget ? (currentTotal / monthlyBudget) * 100 : 0;
  const maxChartValue = Math.max(...chartData.map((d) => d.total), 100);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Definir Meta Mensal</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                Valor da Meta (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBudgetModal(false);
                  setBudgetInput('');
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-black rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBudget}
                className="flex-1 px-4 py-3 bg-[#ffcc00] text-black rounded-xl hover:bg-[#ffd400] transition font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#ffcc00] p-3 rounded-xl">
                <Wallet className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Financeiro</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Acompanhe seus gastos com compras
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-[#ffcc00] to-[#ffd400] rounded-2xl p-6 text-black">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">Total do Mês</span>
                <DollarSign className="w-5 h-5 opacity-90" />
              </div>
              <div className="text-3xl font-bold mb-1">{formatCurrency(currentTotal)}</div>
              <div className="flex items-center gap-2 text-sm">
                {difference >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {Math.abs(percentageChange).toFixed(1)}% vs mês anterior
                </span>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Mês Anterior</span>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-black mb-1">
                {formatCurrency(previousTotal)}
              </div>
              <div className="text-sm text-gray-500">
                {months[selectedMonth === 0 ? 11 : selectedMonth - 1]}
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total de Compras</span>
                <ShoppingBag className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-black mb-1">{purchases.length}</div>
              <div className="text-sm text-gray-500">
                {purchases.reduce((sum, p) => sum + p.item_count, 0)} itens
              </div>
            </div>
          </div>

          {monthlyBudget && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Meta Mensal</span>
                  {budgetPercentage >= 80 && (
                    <AlertTriangle className="w-4 h-4 text-[#ffcc00]" />
                  )}
                </div>
                <button
                  onClick={() => {
                    setBudgetInput(monthlyBudget.toString());
                    setShowBudgetModal(true);
                  }}
                  className="text-sm text-[#ffcc00] hover:text-[#ffd400] font-medium"
                >
                  Editar
                </button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    budgetPercentage >= 100
                      ? 'bg-red-500'
                      : budgetPercentage >= 80
                      ? 'bg-[#ffcc00]'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {formatCurrency(currentTotal)} de {formatCurrency(monthlyBudget)}
                </span>
                <span
                  className={`font-bold ${
                    budgetPercentage >= 100
                      ? 'text-red-600'
                      : budgetPercentage >= 80
                      ? 'text-[#ffcc00]'
                      : 'text-green-600'
                  }`}
                >
                  {budgetPercentage.toFixed(0)}%
                </span>
              </div>
              {budgetPercentage >= 80 && (
                <div className="mt-3 p-3 bg-[#ffcc00]/10 border border-[#ffcc00] rounded-lg">
                  <p className="text-sm text-gray-700">
                    {budgetPercentage >= 100
                      ? 'Você ultrapassou sua meta mensal!'
                      : 'Atenção! Você está próximo de atingir sua meta mensal.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!monthlyBudget && (
            <button
              onClick={() => setShowBudgetModal(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[#ffcc00] hover:text-[#ffcc00] transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Definir Meta Mensal
            </button>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-black">Evolução dos Gastos (6 meses)</h3>
            </div>
            <div className="flex items-end gap-4 h-48">
              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: '160px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-[#ffcc00] to-[#ffd400] rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${(data.total / maxChartValue) * 100}%`,
                        minHeight: data.total > 0 ? '4px' : '0'
                      }}
                      title={formatCurrency(data.total)}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-black mb-4">Histórico de Compras</h2>

          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-[#ffcc00]/10 p-6 rounded-full w-fit mx-auto mb-4">
                <ShoppingBag className="w-12 h-12 text-[#ffcc00]" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Nenhuma compra registrada</h3>
              <p className="text-gray-600">
                As compras finalizadas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-[#ffcc00] transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#ffcc00]/10 p-3 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-[#ffcc00]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">{purchase.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(purchase.purchase_date)}
                        </span>
                        <span>{purchase.item_count} itens</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#ffcc00]">
                      {formatCurrency(purchase.total_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
