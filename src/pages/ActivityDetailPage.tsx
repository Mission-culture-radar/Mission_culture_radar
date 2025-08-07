import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAuthedSupabaseClient } from '../lib/authedClient';
import ActivityCharts from '../components/ActivityCharts';

const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [supabase, setSupabase] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;

    const client = createAuthedSupabaseClient(token);
    setSupabase(client);

    const fetchActivityAndStats = async () => {
      const { data: activityData, error: activityError } = await client
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (activityError || !activityData) {
        alert('❌ Activité introuvable.');
        return;
      }

      // 🔹 Fetch image from activity_blobs
      const { data: blobs } = await client
        .from('activity_blobs')
        .select('blob_link')
        .eq('activity_id', id)
        .limit(1);

      const image = blobs?.[0]?.blob_link || '/placeholder.jpg';

      setActivity({ ...activityData, image });

      // 🔹 Fetch participant count
      const { count: participants } = await client
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', id)
        .eq('user_participates', true);

      // 🔹 Fetch like count
      const { count: likes } = await client
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', id)
        .eq('activity_is_liked', true);

      setParticipantCount(participants || 0);
      setLikeCount(likes || 0);
      setLoading(false);
    };

    fetchActivityAndStats();
  }, [id]);

  if (loading || !activity) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white p-10">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#230022] via-[#230022] to-[#561447] text-white">
      <div className="p-10 max-w-6xl mx-auto space-y-12">
        {/* 🖼️ Image + Description side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Image */}
          <img
            src={activity.image}
            alt={activity.title}
            className="rounded-lg w-full h-auto object-cover border border-[#C30D9B]"
          />

          {/* Text */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{activity.title}</h1>
            <p className="text-white/80 text-lg mb-6">{activity.description}</p>

            <div className="flex gap-8 text-xl">
              <div>
                <p className="text-[#C30D9B] font-bold text-2xl">{participantCount}</p>
                <p className="text-white">participants</p>
              </div>
              <div>
                <p className="text-purple-400 font-bold text-2xl">696</p>
                <p className="text-white">
                  clicks depuis le début<br />de la dernière campagne
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            className="bg-gradient-to-r from-[#C30D9B] to-[#E60073] text-white py-3 px-6 rounded-full w-full md:w-auto"
            onClick={() => alert("🔜 Amplification à venir")}
          >
            J’amplifie ma campagne de publicité
          </button>
          <button
            onClick={() => navigate(`/activity/${id}/edit`)}
            className="bg-white text-[#C30D9B] font-semibold py-3 px-6 rounded-full w-full md:w-auto"
          >
            Modifier l’événement
          </button>
        </div>

        <ActivityCharts />
      </div>
    </div>
  );
};

export default ActivityDetailPage;