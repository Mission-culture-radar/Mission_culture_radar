import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';

// Fonction de géocodage via OpenStreetMap
async function geocodeAddress(address: string): Promise<{ type: string; coordinates: [number, number] } | null> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const data = await response.json();

  if (data && data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    return {
      type: "Point",
      coordinates: [lon, lat]
    };
  }

  return null;
}

// Fonction upload vers edge function
async function uploadActivityMedia({
  jwt,
  activityId,
  files,
}: {
  jwt: string;
  activityId: number;
  files: File[];
}) {
  const formData = new FormData();
  formData.append("activity_id", activityId.toString());
  for (const file of files) {
    formData.append("file", file);
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uploadmedia-activities`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Échec de l’upload");
  return data.uploaded;
}

const CreateEventPage: React.FC = () => {
  const [supabase, setSupabase] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    website: '',
    tags: [] as string[],
    eventDate: '',
    eventTime: ''
  });
  const [newTag, setNewTag] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Vous devez être connecté.');
      return;
    }

    const client = createAuthedSupabaseClient(token);
    setSupabase(client);

    const fetchUser = async () => {
      const { data, error } = await client.from('users').select('id, role_id').single();
      if (error || !data) {
        console.error('Erreur récupération user:', error);
        setIsLoading(false);
        return;
      }

      setUserId(data.id);
      setRoleId(data.role_id);
      setAuthorized([2, 3].includes(data.role_id));
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
  };

  const uploadFiles = async (activityId: number, jwt: string) => {
    if (!uploadedFiles.length) return;
    try {
      const urls = await uploadActivityMedia({ jwt, activityId, files: uploadedFiles });
      console.log("✅ Images uploadées :", urls);
    } catch (err) {
      console.error("Erreur upload images :", err);
      throw err;
    }
  };


  async function moderateActivity(
    activityId: number,
    jwt: string
  ): Promise<{
    success: boolean;
    new_status_id?: number;
    verdict?: string;
    justification?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ activity_id: activityId }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Erreur inattendue",
        };
      }

      return {
        success: true,
        new_status_id: data.new_status_id,
        verdict: data.verdict,
        justification: data.justification,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Erreur réseau ou serveur",
      };
    }
  }

  const handleSubmit = async () => {
    if (!authorized || !userId || !supabase) {
      alert("❌ Vous n’avez pas la permission de créer un événement.");
      return;
    }

    const token = localStorage.getItem('token')!;
    try {
      const { data: activity, error: insertError } = await supabase
        .from('activities')
        .insert([{ creator_id: userId, title: 'Untitled Event' }])
        .select()
        .single();

      if (insertError || !activity) throw insertError;

      const activityId = activity.id;

      const datetime = formData.eventDate && formData.eventTime
        ? `${formData.eventDate} ${formData.eventTime}`
        : null;

      const fullAddress = `${formData.address}, ${formData.postalCode} ${formData.city}`;
      const geo = await geocodeAddress(fullAddress);
      if (!geo) {
        alert("❌ Adresse invalide ou introuvable.");
        return;
      }

      const { error: rpcError } = await supabase.rpc('submit_activity_full', {
        _activity_id: activityId,
        _title: formData.title,
        _description: formData.description,
        _event_datetime: datetime,
        _address: geo,
        _tags: formData.tags,
        _mail: formData.email,
        _phone: formData.phone,
        _website: formData.website
      });

      if (rpcError) throw rpcError;

      await uploadFiles(activityId, token);

      const moderation = await moderateActivity(activityId, token);

      if (moderation.success) {
        const verdict = moderation.verdict?.toLowerCase();
        if (verdict === "yes") {
          alert("✅ Événement validé automatiquement !");
        } else if (verdict === "maybe") {
          alert(`🟡 Votre événement est en attente de validation manuelle.\n\n💬 Raison : ${moderation.justification}`);
        } else if (verdict === "no") {
          alert(`❌ Votre événement n’a pas été approuvé.\n\n💬 Raison : ${moderation.justification}\n\n`);
        } else {
          alert("⚠️ Résultat de modération inattendu. Un modérateur vérifiera manuellement.");
        }
      } else {
        alert("✅ Événement créé, mais la modération automatique a échoué. Il sera vérifié manuellement.");
      }

    } catch (err) {
      console.error(err);
      alert('❌ Une erreur est survenue lors de la création.');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#230022] to-[#561447] text-white">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] to-[#561447] pt-12 pb-20 px-4 text-white">
      <div className="max-w-4xl mx-auto bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl space-y-8">
        <h2 className="text-3xl font-bold text-center">Créer un événement</h2>

        <input type="text" name="title" placeholder="Titre *" value={formData.title} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm placeholder-gray-600" />
        <textarea name="description" placeholder="Description *" value={formData.description} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-2xl text-sm placeholder-gray-600 resize-none" rows={4} />
        <div className="grid grid-cols-2 gap-4">
          <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange}
            className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
          <input type="time" name="eventTime" value={formData.eventTime} onChange={handleInputChange}
            className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
        </div>
        <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
        <input type="tel" name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="address" placeholder="Adresse" value={formData.address} onChange={handleInputChange}
            className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
          <input type="text" name="city" placeholder="Ville" value={formData.city} onChange={handleInputChange}
            className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
        </div>
        <input type="text" name="postalCode" placeholder="Code postal" value={formData.postalCode} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
        <input type="url" name="website" placeholder="Site Web" value={formData.website} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />

        {/* Tags */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 text-gray-800 text-sm rounded-full">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-gray-600 hover:text-gray-800">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-6 py-4 bg-white text-gray-800 rounded-full text-sm" placeholder="Ajouter un tag..." />
            <button type="button" onClick={addTag}
              className="w-12 h-12 bg-white text-gray-800 hover:bg-gray-200 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Upload fichiers avec preview */}
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {previewUrls.map((url, index) => (
              <img key={index} src={url} alt={`Preview ${index}`} className="rounded-xl h-32 w-full object-cover" />
            ))}
          </div>
        </div>

        {/* Soumettre */}
        <button onClick={handleSubmit}
          className="w-full bg-[#C30D9B] hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full transition-all">
          Soumettre
        </button>
      </div>
    </div>
  );
};

export default CreateEventPage;
