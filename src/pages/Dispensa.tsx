import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AddPantryItemModal from '../components/AddPantryItemModal';
import { Package, Plus, CreditCard as Edit2, Trash2, AlertTriangle, CheckCircle2, XCircle, Minus, ShoppingCart, Calendar } from 'lucide-react';

type PantryItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  low_stock_threshold: number;
  notes: string;
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
};

type StockStatus = 'sufficient' | 'low' | 'out' | 'expired';

export default function Dispensa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');

  useEffect(() => {
    if (user) {
      loadPantryItems();
    }
  }, [user]);

  const loadPantryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select(`
          *,
          product:products(id, name, category)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading pantry items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (data: {
    productId: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    lowStockThreshold: number;
    notes: string;
  }) => {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .insert([
          {
            user_id: user?.id,
            product_id: data.productId,
            quantity: data.quantity,
            unit: data.unit,
            expiry_date: data.expiryDate || null,
            low_stock_threshold: data.lowStockThreshold,
            notes: data.notes
          }
        ]);

      if (error) throw error;
      loadPantryItems();
    } catch (error) {
      console.error('Error adding pantry item:', error);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      loadPantryItems();
      setEditingItem(null);
      setEditQuantity('');
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item da dispensa?')) return;

    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      loadPantryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleMoveToList = async (item: PantryItem) => {
    try {
      const { data: currentList } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_current', true)
        .maybeSingle();

      if (!currentList) {
        alert('Você precisa criar uma lista atual primeiro!');
        navigate('/listas');
        return;
      }

      const { error } = await supabase
        .from('list_items')
        .insert([
          {
            list_id: currentList.id,
            product_id: item.product_id,
            quantity: 1,
            is_purchased: false
          }
        ]);

      if (error) throw error;
      alert('Item adicionado à lista atual!');
    } catch (error) {
      console.error('Error moving to list:', error);
    }
  };

  const getStockStatus = (item: PantryItem): StockStatus => {
    if (item.expiry_date) {
      const expiryDate = new Date(item.expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        return 'expired';
      }
    }

    if (item.quantity <= 0) {
      return 'out';
    }

    if (item.quantity <= item.low_stock_threshold) {
      return 'low';
    }

    return 'sufficient';
  };

  const getStatusIcon = (status: StockStatus) => {
    switch (status) {
      case 'sufficient':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'out':
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'sufficient':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Estoque OK
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            Estoque Baixo
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Em Falta
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Vencido
          </span>
        );
    }
  };

  const getAlerts = () => {
    return items.filter((item) => {
      const status = getStockStatus(item);
      return status === 'low' || status === 'out' || status === 'expired';
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const alerts = getAlerts();

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
      <AddPantryItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddItem}
        userId={user?.id || ''}
      />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#ffcc00] p-3 rounded-xl">
                <Package className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Dispensa</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Controle o estoque da sua casa
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Item
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-[#ffcc00]/10 border-2 border-[#ffcc00] rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#ffcc00] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-black mb-2">Alertas Inteligentes</h3>
                <ul className="space-y-2">
                  {alerts.map((item) => {
                    const status = getStockStatus(item);
                    let message = '';

                    if (status === 'expired') {
                      message = `${item.product.name} está vencido!`;
                    } else if (status === 'out') {
                      message = `${item.product.name} está em falta!`;
                    } else if (status === 'low') {
                      message = `${item.product.name} está acabando!`;
                    }

                    return (
                      <li key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{message}</span>
                        <button
                          onClick={() => handleMoveToList(item)}
                          className="text-[#ffcc00] hover:text-[#ffd400] font-medium text-xs"
                        >
                          Adicionar à lista
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-[#ffcc00]/10 p-6 rounded-full w-fit mx-auto mb-4">
                <Package className="w-12 h-12 text-[#ffcc00]" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Dispensa vazia</h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando os produtos que você tem em casa para controlar seu estoque.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
              >
                <Plus className="w-5 h-5" />
                Adicionar Primeiro Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const status = getStockStatus(item);
              const isEditing = editingItem === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow ${
                    status === 'low' || status === 'out' || status === 'expired'
                      ? 'ring-2 ring-[#ffcc00]'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">
                          {item.product.name}
                        </h3>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantidade:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20 px-2 py-1 border-2 border-[#ffcc00] rounded-lg text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.id, parseFloat(editQuantity))}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setEditQuantity('');
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#ffcc00]">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => {
                              setEditingItem(item.id);
                              setEditQuantity(item.quantity.toString());
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {item.expiry_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Validade:</span>
                        <span className="flex items-center gap-1 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          {formatDate(item.expiry_date)}
                        </span>
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-xs text-gray-500 line-clamp-2">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition text-sm font-medium"
                    >
                      <Minus className="w-4 h-4" />
                      Consumir
                    </button>
                    <button
                      onClick={() => handleMoveToList(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-lg transition text-sm font-medium"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Lista
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
