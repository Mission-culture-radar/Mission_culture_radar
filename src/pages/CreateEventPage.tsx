import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';

const CreateEventPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    website: '',
    tags: [] as string[],
    eventDate: '',
    eventTime: ''
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        setUser(data.session.user);
      }
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
  };

  const uploadFiles = async (activityId: number) => {
    const paths = await Promise.all(uploadedFiles.map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('activity-files')
        .upload(`activities/${fileName}`, file);
      if (error) throw error;

      await supabase.rpc('add_activity_blob', {
        _activity_id: activityId,
        _blob_link: data.path
      });

      return data.path;
    }));

    return paths;
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Connectez-vous pour créer un événement");
      return;
    }

    setIsLoading(true);

    try {
      const { data: initActivity, error: creationError } = await supabase
        .from('activities')
        .insert([{ creator_id: user.id, title: 'Untitled Event' }])
        .select()
        .single();

      if (creationError || !initActivity) {
        throw creationError;
      }

      const activityId = initActivity.id;

      const fullDate = formData.eventDate && formData.eventTime
        ? `${formData.eventDate} ${formData.eventTime}`
        : null;

      const addressGeo = null; // TODO: géocoder ou adapter selon ton format `geometry`

      const { error: rpcError } = await supabase.rpc('submit_activity_full', {
        _activity_id: activityId,
        _title: formData.title,
        _description: formData.description,
        _event_datetime: fullDate,
        _address: addressGeo,
        _tags: formData.tags,
        _mail: formData.email,
        _phone: formData.phone,
        _website: formData.website
      });

      if (rpcError) throw rpcError;

      await uploadFiles(activityId);

      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;

      if (token) {
        const res = await fetch('/functions/v1/moderate-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ activity_id: activityId })
        });

        const result = await res.json();
        alert(`Modération : ${result.verdict}`);
      } else {
        alert("Événement soumis sans modération.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la soumission.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-2xl font-bold text-center">Créer un événement</h2>

        <input type="text" name="title" placeholder="Titre *" value={formData.title} onChange={handleInputChange} className="input" />
        <textarea name="description" placeholder="Description *" value={formData.description} onChange={handleInputChange} className="textarea" />

        <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} className="input" />
        <input type="time" name="eventTime" value={formData.eventTime} onChange={handleInputChange} className="input" />

        <input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleInputChange} className="input" />
        <input type="tel" name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleInputChange} className="input" />

        <input type="text" name="address" placeholder="Adresse" value={formData.address} onChange={handleInputChange} className="input" />
        <input type="text" name="city" placeholder="Ville" value={formData.city} onChange={handleInputChange} className="input" />
        <input type="text" name="postalCode" placeholder="Code postal" value={formData.postalCode} onChange={handleInputChange} className="input" />
        <input type="url" name="website" placeholder="Site Web" value={formData.website} onChange={handleInputChange} className="input" />

        <div>
          <label className="font-semibold block mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            {formData.tags.map((tag) => (
              <span key={tag} className="bg-gray-200 px-3 py-1 rounded-full">
                {tag} <button onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="input flex-1" placeholder="Ajouter un tag..." />
            <button type="button" onClick={addTag} className="bg-blue-500 text-white px-3 rounded-full"><Plus size={16} /></button>
          </div>
        </div>

        <input type="file" multiple onChange={handleFileChange} className="block w-full mt-4" />

        <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-pink-600 text-white py-3 rounded-lg">
          {isLoading ? 'Envoi...' : 'Soumettre'}
        </button>
      </div>
    </div>
  );
};

export default CreateEventPage;
