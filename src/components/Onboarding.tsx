import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Cherry, User, Users, CheckCircle } from 'lucide-react';

type OnboardingProps = {
  onComplete: () => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [householdSize, setHouseholdSize] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile, updateProfile } = useAuth();

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!name || !age) {
        setError('Por favor, preencha todos os campos');
        return;
      }
      setError('');
      setStep(3);
    } else if (step === 3) {
      if (!householdSize) {
        setError('Por favor, informe o número de pessoas');
        return;
      }
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    const { error } = await updateProfile({
      name: name || profile?.name || '',
      age: parseInt(age),
      household_size: parseInt(householdSize),
      onboarding_completed: true,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        {step === 1 && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-[#ffcc00] p-6 rounded-2xl">
                <Cherry className="w-16 h-16 text-black" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-black mb-4">
              Bem-vindo ao Cherry!
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Vamos começar configurando sua conta para uma experiência personalizada.
            </p>
            <button
              onClick={handleNext}
              className="w-full bg-[#ffcc00] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#e6b800] transition"
            >
              Começar
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex justify-center mb-6">
              <div className="bg-[#ffcc00] p-4 rounded-2xl">
                <User className="w-12 h-12 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2 text-center">
              Conte-nos sobre você
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Essas informações nos ajudam a personalizar sua experiência
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                  Nome
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
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-[#ffcc00] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#e6b800] transition mt-6"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex justify-center mb-6">
              <div className="bg-[#ffcc00] p-4 rounded-2xl">
                <Users className="w-12 h-12 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2 text-center">
              Sobre sua casa
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Quantas pessoas moram com você?
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="householdSize" className="block text-sm font-medium text-black mb-2">
                Número de pessoas
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

            <div className="bg-[#f5f5f5] rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#ffcc00] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-black mb-1">Como o Cherry ajuda?</h3>
                  <p className="text-sm text-gray-600">
                    Com essas informações, podemos sugerir melhores quantidades para suas listas de compras
                    e ajudar você a gerenciar a dispensa de forma mais eficiente.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-[#ffcc00] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#e6b800] transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finalizando...' : 'Finalizar'}
            </button>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i === step ? 'bg-[#ffcc00] w-8' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
