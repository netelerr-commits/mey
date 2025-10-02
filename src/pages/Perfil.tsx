import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Save } from 'lucide-react';

export default function Perfil() {
  const { user, profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [householdSize, setHouseholdSize] = useState(profile?.household_size?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    const { error: updateError } = await updateProfile({
      name,
      age: age ? parseInt(age) : null,
      household_size: householdSize ? parseInt(householdSize) : null,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#ffcc00] p-3 rounded-xl">
            <User className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black">Meu Perfil</h1>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
            Perfil atualizado com sucesso!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-[#f5f5f5] text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent outline-none transition"
              placeholder="Seu nome"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-black mb-2">
                Idade
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                max="120"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent outline-none transition"
                placeholder="Ex: 25"
              />
            </div>

            <div>
              <label htmlFor="householdSize" className="block text-sm font-medium text-black mb-2">
                Pessoas na casa
              </label>
              <input
                id="householdSize"
                type="number"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                min="1"
                max="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffcc00] focus:border-transparent outline-none transition"
                placeholder="Ex: 4"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-[#ffcc00] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#e6b800] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
