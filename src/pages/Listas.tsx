import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import CreateListModal from '../components/CreateListModal';
import { ListChecks, Plus, CreditCard as Edit2, Archive, Trash2, Star, Calendar, ShoppingBag, MoreVertical } from 'lucide-react';

type List = {
  id: string;
  name: string;
  notes: string;
  status: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  item_count?: number;
  purchased_count?: number;
};

export default function Listas() {
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadLists();
    }
  }, [user]);

  const loadLists = async () => {
    try {
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (listsError) throw listsError;

      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { data: items } = await supabase
            .from('list_items')
            .select('id, is_purchased')
            .eq('list_id', list.id);

          const itemCount = items?.length || 0;
          const purchasedCount = items?.filter((item) => item.is_purchased).length || 0;

          return {
            ...list,
            item_count: itemCount,
            purchased_count: purchasedCount
          };
        })
      );

      setLists(listsWithCounts);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (data: { name: string; notes: string; isCurrent: boolean }) => {
    try {
      if (data.isCurrent) {
        await supabase
          .from('lists')
          .update({ is_current: false })
          .eq('user_id', user?.id);
      }

      const { error } = await supabase
        .from('lists')
        .insert([
          {
            user_id: user?.id,
            name: data.name,
            notes: data.notes,
            is_current: data.isCurrent,
            status: 'active'
          }
        ]);

      if (error) throw error;

      loadLists();
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleSetCurrent = async (listId: string) => {
    try {
      await supabase
        .from('lists')
        .update({ is_current: false })
        .eq('user_id', user?.id);

      await supabase
        .from('lists')
        .update({ is_current: true })
        .eq('id', listId);

      loadLists();
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error setting current list:', error);
    }
  };

  const handleArchive = async (listId: string) => {
    try {
      await supabase
        .from('lists')
        .update({ status: 'archived', is_current: false })
        .eq('id', listId);

      loadLists();
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error archiving list:', error);
    }
  };

  const handleDelete = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

    try {
      await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      loadLists();
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const getStatusBadge = (list: List) => {
    if (list.is_current) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#ffcc00] text-black text-xs font-medium rounded-full">
          <Star className="w-3 h-3" />
          Lista Atual
        </span>
      );
    }
    if (list.status === 'archived') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
          <Archive className="w-3 h-3" />
          Arquivada
        </span>
      );
    }
    if (list.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <ShoppingBag className="w-3 h-3" />
          Concluída
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
        Ativa
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateList}
      />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-[#ffcc00] p-3 rounded-xl">
                <ListChecks className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Minhas Listas</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Crie e gerencie suas listas de compras
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Criar Lista
            </button>
          </div>
        </div>

        {lists.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-[#ffcc00]/10 p-6 rounded-full w-fit mx-auto mb-4">
                <ListChecks className="w-12 h-12 text-[#ffcc00]" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Nenhuma lista criada</h3>
              <p className="text-gray-600 mb-6">
                Comece criando sua primeira lista de compras para organizar melhor suas compras.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffcc00] hover:bg-[#ffd400] text-black rounded-xl transition font-medium"
              >
                <Plus className="w-5 h-5" />
                Criar Primeira Lista
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className={`bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow ${
                  list.is_current ? 'ring-2 ring-[#ffcc00]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black mb-2 line-clamp-1">
                      {list.name}
                    </h3>
                    {getStatusBadge(list)}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === list.id ? null : list.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {activeMenuId === list.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                        {!list.is_current && list.status !== 'archived' && (
                          <button
                            onClick={() => handleSetCurrent(list.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50 transition"
                          >
                            <Star className="w-4 h-4" />
                            Definir como Atual
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar Lista
                        </button>
                        {list.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(list.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50 transition"
                          >
                            <Archive className="w-4 h-4" />
                            Arquivar
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {list.notes && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{list.notes}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {list.purchased_count || 0}/{list.item_count || 0} itens
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(list.updated_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
