import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAuthedSupabaseClient } from '../lib/authedClient';

const ActivityEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [supabase, setSupabase] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [editableFields, setEditableFields] = useState<Record<string, boolean>>({
    title: false,
    description: false,
    email: false,
    phone: false,
    website: false,
    datetime: false,
    address: false,
    image: false
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;

    const client = createAuthedSupabaseClient(token);
    setSupabase(client);

    const fetchData = async () => {
      const { data, error } = await client
        .from('activities_with_coords')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        alert('❌ Activité introuvable.');
        return;
      }

      const { data: blobs } = await client
        .from('activity_blobs')
        .select('blob_link')
        .eq('activity_id', id)
        .limit(1);

      const imageUrl = blobs?.[0]?.blob_link || '/placeholder.jpg';

      // derive date/time nicely
      let date = '';
      let time = '';
      if (data.event_datetime) {
        const dt = new Date(data.event_datetime);
        if (!isNaN(dt.getTime())) {
          // format yyyy-mm-dd and HH:MM
          date = dt.toISOString().slice(0, 10);
          time = dt.toTimeString().slice(0, 5);
        } else {
          // fallback on raw split if needed
          const [d, t] = String(data.event_datetime).split('T') ?? ['', ''];
          date = d || '';
          time = (t || '').slice(0, 5);
        }
      }

      setOriginalData({
        ...data,
        image_url: imageUrl,
        address_geom: data.address // keep original geometry
      });

      setFormData({
        title: data.title,
        description: data.description,
        email: data.mail,
        phone: data.phone,
        website: data.website,
        address: '', // left blank unless user edits
        eventDate: date,
        eventTime: time
      });

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const toggleField = (field: string) => {
    setEditableFields(prev => {
      const next = { ...prev, [field]: !prev[field] };
      if (!next[field] && originalData) {
        setFormData(prevForm => ({
          ...prevForm,
          [field]: originalDataMapper(field, originalData)
        }));
      }
      return next;
    });
  };

  const originalDataMapper = (field: string, data: any) => {
    switch (field) {
      case 'email': return data.mail;
      case 'phone': return data.phone;
      case 'website': return data.website;
      case 'title': return data.title;
      case 'description': return data.description;
      case 'address': return '';
      case 'datetime': return (data.event_datetime || '').split('T');
      default: return '';
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function geocodeAddress(address: string): Promise<{ type: string; coordinates: [number, number] } | null> {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return { type: "Point", coordinates: [lon, lat] };
    }
    return null;
  }

  // 🔎 same moderation helper as CreateEventPage
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
    if (!supabase || !id) return;

    const token = localStorage.getItem('token')!;
    const datetime =
      formData.eventDate && formData.eventTime
        ? `${formData.eventDate} ${formData.eventTime}`
        : null;

    // compute address to send (reuse original unless the toggle is enabled)
    let addressToSend = originalData?.address_geom ?? null;
    if (editableFields.address) {
      const geo = await geocodeAddress(formData.address);
      if (!geo) { alert('❌ Adresse invalide'); return; }
      addressToSend = geo;
    }

    const payload = {
      _activity_id: Number(id),
      _title: formData.title ?? null,
      _description: formData.description ?? null,
      _event_datetime: datetime ?? null,
      _address: addressToSend,
      _tags: [],               // unchanged here
      _mail: formData.email ?? null,
      _phone: formData.phone ?? null,
      _website: formData.website ?? null
    };

    try {
      const { error } = await supabase.rpc('submit_activity_full', payload);
      if (error) {
        console.error(error);
        alert('❌ Échec de la mise à jour');
        return;
      }

      // optional image upload
      if (editableFields.image && newImageFile) {
        try {
          const formDataImg = new FormData();
          formDataImg.append('activity_id', id.toString());
          formDataImg.append('file', newImageFile);

          const uploadRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uploadmedia-activities`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formDataImg }
          );

          if (!uploadRes.ok) {
            console.error(await uploadRes.text());
            alert('⚠️ L’événement a été mis à jour, mais l’image n’a pas pu être remplacée.');
          }
        } catch (err) {
          console.error(err);
          alert('⚠️ L’événement a été mis à jour, mais une erreur est survenue sur l’image.');
        }
      }

      // 🧠 call moderation AFTER successful update (+ optional image)
      const moderation = await moderateActivity(Number(id), token);

      if (moderation.success) {
        const verdict = moderation.verdict?.toLowerCase();
        if (verdict === "yes") {
          alert("✅ Modération OK : l’événement reste publié !");
          navigate(`/activity/${id}`);
        } else if (verdict === "maybe") {
          alert(`🟡 Modération : en attente d’une validation manuelle.\n\n💬 Raison : ${moderation.justification}`);
          navigate(`/activity/${id}`);
        } else if (verdict === "no") {
          alert(`❌ Modération : l’événement a été refusé.\n\n💬 Raison : ${moderation.justification}`);
          navigate(`/activity/${id}`);
        } else {
          alert("⚠️ Résultat de modération inattendu. Un modérateur vérifiera manuellement.");
          navigate(`/activity/${id}`);
        }
      } else {
        alert("✅ Événement mis à jour, mais la modération automatique a échoué. Il sera revérifié manuellement.");
        navigate(`/activity/${id}`);
      }
    } catch (e) {
      console.error(e);
      alert('❌ Une erreur est survenue lors de la mise à jour.');
    }
  };

  if (loading || !originalData) return <div className="text-white p-10">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white">
      <div className="p-10 max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Modifier l’événement</h1>

        <FieldBlock label="Titre" field="title" editable={editableFields.title} value={formData.title} onChange={handleChange} toggle={() => toggleField('title')} />
        <FieldBlock label="Description" field="description" editable={editableFields.description} value={formData.description} onChange={handleChange} toggle={() => toggleField('description')} textarea />
        <FieldBlock label="Email" field="email" editable={editableFields.email} value={formData.email} onChange={handleChange} toggle={() => toggleField('email')} />
        <FieldBlock label="Téléphone" field="phone" editable={editableFields.phone} value={formData.phone} onChange={handleChange} toggle={() => toggleField('phone')} />
        <FieldBlock label="Site web" field="website" editable={editableFields.website} value={formData.website} onChange={handleChange} toggle={() => toggleField('website')} />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-semibold">Date & Heure</label>
            <button onClick={() => toggleField('datetime')}>✏️</button>
          </div>
          {editableFields.datetime ? (
            <div className="flex gap-4">
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="text-black p-2 rounded" />
              <input type="time" name="eventTime" value={formData.eventTime} onChange={handleChange} className="text-black p-2 rounded" />
            </div>
          ) : (
            <div className="bg-gray-600/50 p-3 rounded text-white">{originalData.event_datetime}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-semibold">Adresse</label>
            <button onClick={() => toggleField('address')}>📍</button>
          </div>
          {editableFields.address && (
            <input name="address" placeholder="Tapez votre adresse" onChange={handleChange} className="text-black w-full p-2 rounded" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-semibold">Image</label>
            <button onClick={() => toggleField('image')}>🖼️</button>
          </div>
          {editableFields.image ? (
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && <img src={imagePreview} alt="Prévisualisation" className="rounded max-w-sm" />}
            </div>
          ) : (
            <img src={originalData.image_url || '/placeholder.jpg'} className="rounded max-w-sm" />
          )}
        </div>

        <button onClick={handleSubmit} className="bg-[#C30D9B] text-white py-3 px-6 rounded-full">
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default ActivityEditPage;

const FieldBlock = ({ label, field, editable, value, onChange, toggle, textarea = false }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="font-semibold">{label}</label>
      <button onClick={toggle}>✏️</button>
    </div>
    {editable ? (
      textarea ? (
        <textarea name={field} value={value} onChange={onChange} className="w-full p-3 rounded text-black" />
      ) : (
        <input name={field} value={value} onChange={onChange} className="w-full p-3 rounded text-black" />
      )
    ) : (
      <div className="bg-gray-600/50 p-3 rounded text-white">{value}</div>
    )}
  </div>
);