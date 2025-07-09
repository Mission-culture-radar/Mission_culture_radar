// Partie 1 : Préparation + début page avec section modifiable
import React, { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CreateEventPage: React.FC = () => {
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
  });

  const [editableImage, setEditableImage] = useState('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg');
  const [editableTitle, setEditableTitle] = useState("Nom de l'événement à personnaliser");
  const [editableDescription, setEditableDescription] = useState("Texte de description modifiable par l'organisateur");
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert("Votre événement a été soumis avec succès !");
  };

  const pieData = {
    labels: ['F', 'M'],
    datasets: [
      {
        data: [8.9, 91.1],
        backgroundColor: ['#C30D9B', '#561447'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['10', '20', '30', '40', '50', '60', '70'],
    datasets: [
      {
        label: 'Âge',
        data: [50, 160, 175, 110, 60, 30, 10],
        backgroundColor: '#E52D52',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] to-[#561447] pt-8 pb-16 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Zone modifiable */}
       {/* Zone modifiable avec image en local + card visuelle */}
<div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl space-y-4">
  {/* Upload image */}
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditableImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }}
    className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30"
  />

  {/* Image preview */}
  <img
    src={editableImage}
    alt="Prévisualisation"
    className="w-full h-64 object-cover rounded-xl"
  />

  {/* Titre modifiable */}
  <input
    type="text"
    value={editableTitle}
    onChange={(e) => setEditableTitle(e.target.value)}
    className="w-full px-4 py-2 text-lg font-bold bg-white text-gray-800 rounded-full"
    placeholder="Titre de l'événement"
  />

  {/* Description modifiable */}
  <textarea
    value={editableDescription}
    onChange={(e) => setEditableDescription(e.target.value)}
    className="w-full p-4 bg-white text-gray-800 rounded-2xl resize-none"
    rows={4}
    placeholder="Description de l'événement"
  />
</div>

{/* Introduction avant le formulaire */}
<div className="text-center mt-8">
  <h2 className="text-3xl font-semibold mb-4">Voici le formulaire pour créer votre événement :</h2>
  <p className="text-white/80 max-w-xl mx-auto">
    Remplissez les champs ci-dessous pour enregistrer votre événement dans notre base de données.
  </p>
</div>
<div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl space-y-6">
  <h3 className="text-2xl font-semibold mb-4 text-white">Formulaire de création</h3>

  <div className="space-y-4">
    <input
      type="text"
      name="title"
      value={formData.title}
      onChange={handleInputChange}
      required
      className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
      placeholder="Nom de l'Événement (max 100 caractères) *"
      maxLength={100}
    />

    <textarea
      name="description"
      value={formData.description}
      onChange={handleInputChange}
      required
      rows={6}
      className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-2xl text-sm resize-none"
      placeholder="Description (max 2000 caractères) *"
      maxLength={2000}
    />

    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleInputChange}
      required
      className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
      placeholder="Adresse e-mail *"
      maxLength={320}
    />

    <input
      type="tel"
      name="phone"
      value={formData.phone}
      onChange={handleInputChange}
      className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
      placeholder="Numéro de téléphone"
      maxLength={30}
    />

    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
        placeholder="Adresse *"
        maxLength={200}
      />
      <input
        type="text"
        name="city"
        value={formData.city}
        onChange={handleInputChange}
        className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
        placeholder="Ville *"
        maxLength={50}
      />
    </div>

    <input
      type="text"
      name="postalCode"
      value={formData.postalCode}
      onChange={handleInputChange}
      className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
      placeholder="Code postal"
      maxLength={5}
    />

    <input
      type="url"
      name="website"
      value={formData.website}
      onChange={handleInputChange}
      className="w-full px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
      placeholder="Site web"
      maxLength={2000}
    />

    {/* TAGS */}
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {formData.tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 text-gray-800 text-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 text-gray-600 hover:text-gray-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="flex-1 px-6 py-4 bg-white text-gray-800 placeholder-gray-600 rounded-full text-sm"
          placeholder="Ajouter un tag..."
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
        />
        <button
          type="button"
          onClick={addTag}
          className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
        >
          <Plus className="h-5 w-5 text-gray-800" />
        </button>
      </div>
    </div>

    {/* FICHIERS */}
    <div>
      <input
        type="file"
        multiple
        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-gray-800 hover:file:bg-gray-100"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          console.log("Fichiers sélectionnés :", files);
        }}
      />
    </div>

    {/* Bouton Envoyer */}
    <div className="text-center pt-6">
      <button
        type="button"
        onClick={() => {
          console.log("Form data:", formData);
          alert("✅ Votre événement a bien été envoyé !");
          // future call to backend here
        }}
        className="px-8 py-3 bg-[#c30d9b] hover:bg-[#e52d52] text-white font-medium rounded-full transition-all"
      >
        Envoyer
      </button>
    </div>
  </div>
</div>

    </div>
  </div>
);
};

export default CreateEventPage;
