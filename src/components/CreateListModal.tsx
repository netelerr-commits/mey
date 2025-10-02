import { useState } from 'react';
import { X } from 'lucide-react';

type CreateListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; notes: string; isCurrent: boolean }) => void;
};

export default function CreateListModal({ isOpen, onClose, onSubmit }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({ name: name.trim(), notes: notes.trim(), isCurrent });

    setName('');
    setNotes('');
    setIsCurrent(false);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setNotes('');
    setIsCurrent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-black">Criar Nova Lista</h2>
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
              Nome da Lista*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Compra do Mês, Churrasco, Jantar Especial"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione notas ou lembretes sobre esta lista..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#ffcc00] focus:outline-none transition resize-none"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-[#ffcc00]/10 rounded-xl">
            <input
              type="checkbox"
              id="isCurrent"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-gray-300 text-[#ffcc00] focus:ring-2 focus:ring-[#ffcc00] cursor-pointer"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-black cursor-pointer">
              Definir como Lista Atual
            </label>
          </div>

          <p className="text-xs text-gray-500">
            A Lista Atual será exibida automaticamente no "Dia de Compra".
          </p>

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
              Criar Lista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
