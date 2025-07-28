import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createAuthedSupabaseClient } from '../lib/authedClient';

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

  // ✅ Setup Supabase client with token + fetch user role
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

  // ✅ Handlers
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

  const uploadFiles = async (activityId: number) => {
    for (const file of uploadedFiles) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('activity-files')
        .upload(`activities/${fileName}`, file);
      if (error) throw error;

      await supabase.rpc('add_activity_blob', {
        _activity_id: activityId,
        _blob_link: data.path
      });
    }
  };

  const handleSubmit = async () => {
    if (!authorized || !userId || !supabase) {
      alert("❌ Vous n’avez pas la permission de créer un événement.");
      return;
    }

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

      const { error: rpcError } = await supabase.rpc('submit_activity_full', {
        _activity_id: activityId,
        _title: formData.title,
        _description: formData.description,
        _event_datetime: datetime,
        _address: null, // ou calculer géoloc plus tard
        _tags: formData.tags,
        _mail: formData.email,
        _phone: formData.phone,
        _website: formData.website
      });

      if (rpcError) throw rpcError;

      await uploadFiles(activityId);

      alert('✅ Événement créé et en attente de modération !');
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

        {/* Champs texte */}
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

        {/* Infos contact */}
        <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />
        <input type="tel" name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleInputChange}
          className="w-full px-6 py-4 bg-white text-gray-800 rounded-full text-sm" />

        {/* Adresse */}
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

        {/* Uploads avec preview */}
        <div>
          <input type="file" multiple onChange={handleFileChange}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {previewUrls.map((url, index) => (
              <img key={index} src={url} alt={`Preview ${index}`} className="rounded-xl h-32 w-full object-cover" />
            ))}
          </div>
        </div>

        {/* Bouton de soumission */}
        <button onClick={handleSubmit}
          className="w-full bg-[#C30D9B] hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full transition-all">
          Soumettre
        </button>
      </div>
    </div>
  );
};

export default CreateEventPage;
