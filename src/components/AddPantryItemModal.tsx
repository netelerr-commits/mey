import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Product = {
  id: string;
  name: string;
  category: string;
};

type AddPantryItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    lowStockThreshold: number;
    notes: string;
  }) => void;
  userId: string;
};

const UNITS = [
  { value: 'un', label: 'Unidade(s)' },
  { value: 'kg', label: 'Quilograma(s)' },
  { value: 'g', label: 'Grama(s)' },
  { value: 'l', label: 'Litro(s)' },
  { value: 'ml', label: 'Mililitro(s)' },
  { value: 'pacote', label: 'Pacote(s)' },
  { value: 'caixa', label: 'Caixa(s)' }
];

export default function AddPantryItemModal({ isOpen, onClose, onSubmit, userId }: AddPantryItemModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('un');
  const [expiryDate, setExpiryDate] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('1');
  const [notes, setNotes] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadProducts();
    }
  }, [isOpen, userId]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            user_id: userId,
            name: newProductName.trim(),
            category: '',
            default_quantity: 1
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setProducts([...products, data]);
      setProductId(data.id);
      setNewProductName('');
      setShowNewProduct(false);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;

    onSubmit({
      productId,
      quantity: parseFloat(quantity),
      unit,
      expiryDate,
      lowStockThreshold: parseFloat(lowStockThreshold),
      notes: notes.trim()
    });

    setProductId('');
    setQuantity('1');
    setUnit('un');
    setExpiryDate('');
    setLowStockThreshold('1');
    setNotes('');
    setShowNewProduct(false);
    onClose();
  };

  const handleClose = () => {
    setProductId('');
    setQuantity('1');
    setUnit('un');
    setExpiryDate('');
    setLowStockThreshold('1');
    setNotes('');
    setNewProductName('');
    setShowNewProduct(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-black">Adicionar Item na Dispensa</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Produto*
            </label>
            {!showNewProduct ? (
              <div className="space-y-2">
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewProduct(true)}
                  className="text-sm text-[#ffcc00] hover:text-[#ffd400] font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Criar novo produto
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Nome do novo produto"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleCreateProduct}
                    className="px-4 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
                  >
                    Criar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProduct(false);
                    setNewProductName('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quantidade*
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Unidade*
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Data de Validade (opcional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Alerta de Estoque Baixo
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Você será alertado quando a quantidade estiver abaixo deste valor
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione notas sobre este item..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-black rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#ffcc00] text-black rounded-xl hover:bg-[#ffd400] transition font-medium"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
