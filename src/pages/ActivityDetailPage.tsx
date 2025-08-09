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

      // 🔹 Fetch tags from activity_tags
      const { data: tagData, error: tagError } = await client
        .from('activity_tags')
        .select('tags(name)')
        .eq('activity_id', id);

      if (tagError) {
        console.error('Erreur chargement tags:', tagError);
      }

      const tags = tagData?.map((row: any) => row.tags?.name).filter(Boolean) || [];

      setActivity({ ...activityData, image, tags });

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
      <div className="p-10 max-w-6xl mx-auto space-y-10">
        {/* 🏷️ Title spans full width to avoid column height mismatch */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          {activity.title}
        </h1>

        {/* 🖼️ Image + Description balanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Image column */}
          <div className="self-stretch">
            <div className="rounded-lg overflow-hidden border border-[#C30D9B] md:h-[26rem]">
              <img
                src={activity.image}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tags */}
            {activity.tags && activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {activity.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-[#C30D9B]/20 text-[#C30D9B] border border-[#C30D9B] px-3 py-1 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description column (matches image height) */}
          <div className="self-stretch flex">
            <div className="text-white/80 text-lg w-full md:h-[26rem] overflow-y-auto p-4 rounded-lg border border-[#C30D9B] bg-white/10 scrollbar-thin scrollbar-thumb-[#C30D9B]/60 scrollbar-track-transparent">
              {activity.description}
            </div>
          </div>
        </div>

        {/* 📊 Stats */}
        <div className="flex gap-8 text-xl">
          <div>
            <p className="text-[#C30D9B] font-bold text-2xl">{participantCount}</p>
            <p className="text-white">Participants</p>
          </div>
          <div>
            <p className="text-purple-300 font-bold text-2xl">{likeCount}</p>
            <p className="text-white">Likes</p>
          </div>
        </div>

        {/* 🚀 Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-start">
          <button
            className="bg-gradient-to-r from-[#C30D9B] to-[#E60073] text-white py-3 px-6 rounded-full w-full md:w-auto"
            onClick={() => alert('🔜 Amplification à venir')}
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