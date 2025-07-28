import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const API_URL = 'https://ssfmhopnysidfqxdhgaa.supabase.co/functions/v1/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [code, setCode] = useState('');
  const [tempUserData, setTempUserData] = useState<any>(null); // pour sauvegarder temporairement les infos
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Étape 3 : LOGIN
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'login',
          email: formData.email,
          password: formData.password
        }),
      });
      const json = await res.json();

      if (json.token) {
        localStorage.setItem('token', json.token); 
        alert('Connexion réussie !');
        navigate('/profile');
      } else {
        alert('Échec de la connexion');
        console.error(json);
      }

    } else {
      // Étape 1 : SIGNUP
      const res = await fetch(API_URL, {
        method: 'POST',
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` 
            },
        body: JSON.stringify({
          action: 'signup',
          email: formData.email.toLowerCase(),
          password: formData.password,
          username: formData.name,
          gender_id: 0
        }),
      });

      const json = await res.json();
      console.log(json);

      if (json.message === 'Verification code sent.' || json.code) {
        setTempUserData({
          email: formData.email.toLowerCase(),
          password: formData.password,
          username: formData.name,
        });
        setStep('verify');
      } else {
        alert('Erreur lors de la création du compte');
        console.error(json);
      }
    }
  };

  const handleVerifyCode = async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' ,
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` 
      },
      
      body: JSON.stringify({
        action: 'verify',
        email: tempUserData.email,
        code: code
      }),
    });

    const json = await res.json();

    if (json.token) {
      localStorage.setItem('token', json.token);
      alert('Compte vérifié avec succès !');
      navigate('/profile');
    } else {
      alert('Code invalide');
      console.error(json);
    }
  };

  // Affichage principal
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] to-[#561447] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-md w-full">
        <div className="relative bg-[#2d1b2f] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
          <div className="flex justify-center mb-6">
            <img src="/logo_final_fond_noir.png" alt="CultureRadar Logo" className="h-16" />
          </div>

          {step === 'form' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Bon retour !' : 'Rejoignez-nous'}</h2>
                <p className="text-white/80">
                  {isLogin
                    ? 'Connectez-vous pour découvrir vos événements'
                    : 'Créez votre compte pour commencer l\'aventure'}
                </p>
              </div>

              {/* Switch login/signup */}
              <div className="flex bg-[#3a1f40] rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${isLogin ? 'bg-[#C30D9B] text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
                >
                  Se connecter
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${!isLogin ? 'bg-[#C30D9B] text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
                >
                  S'inscrire
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#3a1f40] border border-white/10 rounded-lg text-white placeholder-gray-400"
                        placeholder="Jean Dupont"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#3a1f40] border border-white/10 rounded-lg text-white placeholder-gray-400"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-[#3a1f40] border border-white/10 rounded-lg text-white placeholder-gray-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#3a1f40] border border-white/10 rounded-lg text-white placeholder-gray-400"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-white/10 bg-[#3a1f40] text-[#C30D9B]" />
                      <span className="ml-2 text-sm text-white/80">Se souvenir de moi</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-[#C30D9B] hover:text-pink-300">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                )}

                <button type="submit" className="w-full bg-[#C30D9B] text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-600 transition-all transform hover:scale-105 shadow-lg">
                  {isLogin ? 'Se connecter' : 'Créer mon compte'}
                </button>
              </form>
            </>
          )}

          {/* Étape de vérification */}
          {step === 'verify' && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-semibold">Vérifiez votre e-mail</h2>
              <p className="text-white/80">Entrez le code que vous avez reçu par e-mail pour finaliser l’inscription.</p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full py-3 px-4 bg-[#3a1f40] border border-white/10 rounded-lg text-white text-center tracking-widest text-lg"
                placeholder="123456"
              />
              <button
                onClick={handleVerifyCode}
                className="w-full bg-[#C30D9B] text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-600 transition-all"
              >
                Valider le code
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            {step === 'form' && (
              <p className="text-sm text-white/80">
                {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-1 text-[#C30D9B] hover:text-pink-400 font-medium"
                >
                  {isLogin ? "S'inscrire" : "Se connecter"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
