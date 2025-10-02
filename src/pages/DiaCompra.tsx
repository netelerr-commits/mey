import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ShoppingCart,
  Plus,
  Check,
  Filter,
  TrendingUp,
  Package,
  ListChecks,
  AlertCircle
} from 'lucide-react';

type ListItem = {
  id: string;
  list_id: string;
  product_id: string;
  quantity: number;
  is_purchased: boolean;
  price: number | null;
  notes: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
  list: {
    name: string;
  };
};

type PantryItem = {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  product: {
    id: string;
    name: string;
    category: string;
  };
};

type ViewMode = 'current' | 'pantry' | 'both';
type FilterMode = 'all' | 'purchased' | 'pending';

export default function DiaCompra() {
  const { user } = useAuth();
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: currentList } = await supabase
        .from('lists')
        .select('id, name')
        .eq('user_id', user?.id)
        .eq('is_current', true)
        .maybeSingle();

      setCurrentListId(currentList?.id || null);

      if (currentList) {
        const { data: items, error: itemsError } = await supabase
          .from('list_items')
          .select(`
            *,
            product:products(id, name, category),
            list:lists(name)
          `)
          .eq('list_id', currentList.id)
          .order('is_purchased', { ascending: true });

        if (itemsError) throw itemsError;
        setListItems(items || []);
      }

      const { data: pantry, error: pantryError } = await supabase
        .from('pantry_items')
        .select(`
          *,
          product:products(id, name, category)
        `)
        .eq('user_id', user?.id);

      if (pantryError) throw pantryError;

      const lowStockItems = (pantry || []).filter(
        (item) => item.quantity <= item.low_stock_threshold
      );
      setPantryItems(lowStockItems);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePurchased = async (itemId: string, isPurchased: boolean) => {
    try {
      const { error } = await supabase
        .from('list_items')
        .update({
          is_purchased: !isPurchased,
          purchased_at: !isPurchased ? new Date().toISOString() : null
        })
        .eq('id', itemId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error toggling purchased:', error);
    }
  };

  const handleUpdatePrice = async (itemId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('list_items')
        .update({ price })
        .eq('id', itemId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const handleAddPantryItemToList = async (pantryItem: PantryItem) => {
    if (!currentListId) return;

    try {
      const { error } = await supabase
        .from('list_items')
        .insert([
          {
            list_id: currentListId,
            product_id: pantryItem.product_id,
            quantity: 1,
            is_purchased: false
          }
        ]);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  const handleCompleteList = async () => {
    if (!currentListId) return;

    const purchasedItems = listItems.filter((item) => item.is_purchased);

    if (purchasedItems.length === 0) {
      alert('Marque pelo menos um item como comprado antes de finalizar!');
      return;
    }

    if (!confirm('Finalizar compras? Os itens comprados serão adicionados à dispensa.')) {
      return;
    }

    try {
      for (const item of purchasedItems) {
        const { data: existingPantryItem } = await supabase
          .from('pantry_items')
          .select('id, quantity')
          .eq('user_id', user?.id)
          .eq('product_id', item.product_id)
          .maybeSingle();

        if (existingPantryItem) {
          await supabase
            .from('pantry_items')
            .update({
              quantity: existingPantryItem.quantity + item.quantity
            })
            .eq('id', existingPantryItem.id);
        } else {
          await supabase
            .from('pantry_items')
            .insert([
              {
                user_id: user?.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit: 'un',
                low_stock_threshold: 1
              }
            ]);
        }
      }

      await supabase
        .from('list_items')
        .delete()
        .eq('list_id', currentListId)
        .eq('is_purchased', true);

      alert('Compras finalizadas! Itens adicionados à dispensa.');
      loadData();
    } catch (error) {
      console.error('Error completing list:', error);
      alert('Erro ao finalizar compras. Tente novamente.');
    }
  };

  const getDisplayItems = () => {
    let items: Array<ListItem | PantryItem> = [];

    if (viewMode === 'current' || viewMode === 'both') {
      items = [...items, ...listItems];
    }

    if (viewMode === 'pantry' || viewMode === 'both') {
      const pantryAsListItems = pantryItems.filter(
        (pantryItem) =>
          !listItems.some((listItem) => listItem.product_id === pantryItem.product_id)
      );
      items = [...items, ...pantryAsListItems];
    }

    if (filterMode === 'purchased') {
      items = items.filter((item) => 'is_purchased' in item && item.is_purchased);
    } else if (filterMode === 'pending') {
      items = items.filter((item) => !('is_purchased' in item) || !item.is_purchased);
    }

    return items;
  };

  const getTotalPrice = () => {
    return listItems
      .filter((item) => item.is_purchased && item.price)
      .reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const getProgress = () => {
    if (listItems.length === 0) return 0;
    const purchased = listItems.filter((item) => item.is_purchased).length;
    return (purchased / listItems.length) * 100;
  };

  const displayItems = getDisplayItems();
  const totalPrice = getTotalPrice();
  const progress = getProgress();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!currentListId && pantryItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-[#ffcc00]/10 p-6 rounded-full w-fit mx-auto mb-4">
              <ShoppingCart className="w-12 h-12 text-[#ffcc00]" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Nenhuma lista ativa</h3>
            <p className="text-gray-600 mb-6">
              Crie uma lista e defina-a como "Lista Atual" para começar suas compras.
            </p>
            <a
              href="/listas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Criar Lista
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#ffcc00] p-3 rounded-xl">
              <ShoppingCart className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Dia de Compra</h1>
              <p className="text-gray-600 text-sm mt-1">
                Organize suas compras de forma prática
              </p>
            </div>
          </div>
          {listItems.length > 0 && (
            <button
              onClick={handleCompleteList}
              className="flex items-center gap-2 px-6 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
            >
              <Check className="w-5 h-5" />
              Finalizar Compras
            </button>
          )}
        </div>

        {listItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progresso</span>
              <span className="text-2xl font-bold text-[#ffcc00]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#ffcc00] to-[#ffd400] h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${progress}%` }}
              >
                {progress > 10 && <TrendingUp className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
              <span>
                {listItems.filter((item) => item.is_purchased).length} de {listItems.length} itens
              </span>
              {totalPrice > 0 && (
                <span className="font-bold text-black">
                  Total: R$ {totalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('both')}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                viewMode === 'both'
                  ? 'bg-[#ffcc00] text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ListChecks className="w-4 h-4 inline mr-2" />
              Ambas
            </button>
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                viewMode === 'current'
                  ? 'bg-[#ffcc00] text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Lista Atual
            </button>
            <button
              onClick={() => setViewMode('pantry')}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                viewMode === 'pantry'
                  ? 'bg-[#ffcc00] text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Dispensa
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                filterMode === 'all'
                  ? 'bg-[#ffcc00] text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Todos
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                filterMode === 'pending'
                  ? 'bg-[#ffcc00] text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilterMode('purchased')}
              className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                filterMode === 'purchased'
                  ? 'bg-[#ffcc00] text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Comprados
            </button>
          </div>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-[#ffcc00]/10 p-6 rounded-full w-fit mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-[#ffcc00]" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Nenhum item para exibir</h3>
            <p className="text-gray-600">
              Ajuste os filtros ou adicione itens à sua lista de compras.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="space-y-3">
            {displayItems.map((item) => {
              const isListItem = 'is_purchased' in item;
              const isPurchased = isListItem && item.is_purchased;

              if (isListItem) {
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition ${
                      isPurchased ? 'bg-gray-50' : 'bg-white border-2 border-gray-100 hover:border-[#ffcc00]'
                    }`}
                  >
                    <button
                      onClick={() => handleTogglePurchased(item.id, isPurchased)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${
                        isPurchased
                          ? 'bg-[#ffcc00] border-[#ffcc00]'
                          : 'border-gray-300 hover:border-[#ffcc00]'
                      }`}
                    >
                      {isPurchased && <Check className="w-4 h-4 text-black" />}
                    </button>

                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          isPurchased ? 'text-gray-400 line-through' : 'text-black'
                        }`}
                      >
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Quantidade: {item.quantity}
                        {item.product.category && ` • ${item.product.category}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price || ''}
                          onChange={(e) =>
                            handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-20 px-2 py-1 border-2 border-gray-200 rounded-lg text-sm focus:border-[#ffcc00] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              } else {
                const pantryItem = item as PantryItem;
                return (
                  <div
                    key={pantryItem.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border-2 border-red-200"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-black">
                        {pantryItem.product.name}
                      </h3>
                      <p className="text-sm text-red-600">Em falta na dispensa</p>
                    </div>
                    {currentListId && (
                      <button
                        onClick={() => handleAddPantryItemToList(pantryItem)}
                        className="px-4 py-2 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-lg transition text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Adicionar
                      </button>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
