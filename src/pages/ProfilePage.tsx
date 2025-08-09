import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react'; // removed unused Search import
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

type JwtPayload = {
  user_id: number;
  [key: string]: any;
};

type Gender = { id: number; name: string }; // ✅ NEW

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [token, setToken] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);

  const [genders, setGenders] = useState<Gender[]>([]); // ✅ NEW

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    pfp_link: '',
    address: '',       // ✅ NEW
    gender_id: 0 as number, // ✅ NEW
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const sections = [
    {
      title: "Gérer votre compte",
      content: ["Modifier mes informations", "Changer mon mot de passe", "Supprimer mon compte"]
    },
    {
      title: "Mes sorties enregistrées",
      content: ["Voir les événements à venir", "Historique des participations"]
    },
    {
      title: "Préférences et abonnements",
      content: ["Newsletter", "Alertes CultureRadar"]
    },
    {
      title: "Sécurité",
      content: ["Authentification", "Confidentialité", "Se déconnecter"]
    },
  ];

  const toggleIndex = (index: number) => {
    setActiveIndex(prev => (prev === index ? null : index));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChanged'));
    alert('👋 Déconnecté avec succès !');
    navigate('/');
  };

  useEffect(() => {
    const localToken = localStorage.getItem('token');
    if (!localToken) return;

    const decoded = jwtDecode<JwtPayload>(localToken);
    const uid = decoded.user_id;
    setToken(localToken);
    setUserId(uid);

    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${localToken}`,
          },
        },
      }
    );

    const fetchUserInfo = async () => {
      // fetch user
      const { data, error } = await supabase
        .from('users')
        .select('username, email, phone, pfp_link, address, gender_id') // ✅ NEW
        .eq('id', uid)
        .maybeSingle();

      if (data) {
        setFormData({
          username: data.username || '',
          email: data.email || '',
          phone: data.phone || '',
          pfp_link: data.pfp_link || '',
          address: data.address || '',               // ✅ NEW
          gender_id: data.gender_id ?? 0,            // ✅ NEW
        });
      }

      if (error) {
        console.error('Erreur chargement profil :', error.message);
      }
    };

    const fetchGenders = async () => {
      // you mentioned FK to genders(id). Keep it simple: id + name
      const { data, error } = await supabase
        .from('genders')
        .select('id, name')
        .order('id', { ascending: true });

      if (!error && data) setGenders(data);
    };

    fetchUserInfo();
    fetchGenders(); // ✅ NEW
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => { // ✅ NEW
    setFormData(prev => ({ ...prev, gender_id: Number(e.target.value) }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const uploadUserPfp = async ({ jwt, file }: { jwt: string; file: File }) => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uploadmedia-user-pfp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur d'upload");
    return data.url as string;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !userId) return;

    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    try {
      let uploadedUrl = formData.pfp_link;

      if (selectedFile) {
        uploadedUrl = await uploadUserPfp({ jwt: token, file: selectedFile });
      }

      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          pfp_link: uploadedUrl,
          address: formData.address,                // ✅ NEW
          gender_id: formData.gender_id || 0,       // ✅ NEW
          updated_at: new Date().toISOString(),     // ✅ NEW (MVP: set from frontend)
        })
        .eq('id', userId);

      if (error) throw error;

      alert("✅ Profil mis à jour avec succès !");
      setIsEditing(false);
    } catch (err: any) {
      alert(`❌ Erreur : ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <img
          src="/logo_final_fond_noir.png"
          alt="CultureRadar Logo"
          className="h-20 mx-auto mb-6"
        />

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Bonjour, {formData.username}
        </h1>

        {isEditing && (
          <form onSubmit={handleSubmit} className="bg-[#2d1b2f] p-6 rounded-xl space-y-4 mb-8">
            <div>
              <label className="block text-sm mb-1">Nom d’utilisateur</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3a1f40] border border-white/10 rounded-md text-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3a1f40] border border-white/10 rounded-md text-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Téléphone</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3a1f40] border border-white/10 rounded-md text-white"
              />
            </div>

            {/* ✅ NEW: Address */}
            <div>
              <label className="block text-sm mb-1">Adresse</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adresse postale"
                className="w-full px-4 py-2 bg-[#3a1f40] border border-white/10 rounded-md text-white"
              />
            </div>

            {/* ✅ NEW: Gender */}
            <div>
              <label className="block text-sm mb-1">Genre</label>
              <select
                value={formData.gender_id}
                onChange={handleGenderChange}
                className="w-full px-4 py-2 bg-[#3a1f40] border border-white/10 rounded-md text-white"
              >
                <option value={0}>— Non spécifié —</option>
                {genders.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Photo de profil</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {formData.pfp_link && (
                <img src={formData.pfp_link} alt="Profil" className="mt-2 h-24 rounded-full" />
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-white/20 rounded-md hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#C30D9B] text-white rounded-md hover:bg-pink-600"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-[#2d1b2f] rounded-xl overflow-hidden border border-white/10"
            >
              <button
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg hover:bg-[#3a1f40] transition"
                onClick={() => toggleIndex(index)}
              >
                {section.title}
                {activeIndex === index ? <ChevronUp /> : <ChevronDown />}
              </button>
              {activeIndex === index && (
                <ul className="px-6 pb-4 space-y-2 text-white/80 text-sm list-disc list-inside">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="list-none">
                      {item === "Se déconnecter" ? (
                        <button
                          onClick={handleLogout}
                          className="text-[#C30D9B] hover:text-pink-400 font-semibold hover:underline transition-all"
                        >
                          🔒 {item}
                        </button>
                      ) : item === "Modifier mes informations" ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-[#C30D9B] hover:text-pink-400 font-semibold hover:underline transition-all"
                        >
                          ✏️ {item}
                        </button>
                      ) : (
                        <span className="text-white/80">{item}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;