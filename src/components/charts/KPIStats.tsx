import React, { useEffect, useState } from 'react';
import { createAuthedSupabaseClient } from '../../lib/authedClient';

const KPIStats: React.FC<{ activityId: number; token: string }> = ({ activityId, token }) => {
  const [likes, setLikes] = useState<number | null>(null);
  const [participants, setParticipants] = useState<number | null>(null);
  const [ratio, setRatio] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createAuthedSupabaseClient(token);

      const { count: pCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId)
        .eq('user_participates', true);

      const { count: lCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activityId)
        .eq('activity_is_liked', true);

      const likesCount = lCount || 0;
      const participantsCount = pCount || 0;

      setParticipants(participantsCount);
      setLikes(likesCount);

      if (participantsCount > 0) {
        const percent = (likesCount / participantsCount) * 100;
        setRatio(`${percent.toFixed(1)}%`);
      } else {
        setRatio(null);
      }
    };

    fetchStats();
  }, [activityId, token]);

  return (
    <div className="grid grid-cols-3 gap-8 text-center text-white">
      <div>
        <p className="text-4xl font-bold text-[#C30D9B]">{participants}</p>
        <p className="text-white/80">participants</p>
      </div>
      <div>
        <p className="text-4xl font-bold text-purple-400">{likes}</p>
        <p className="text-white/80">likes</p>
      </div>
      <div>
        <p className="text-4xl font-bold text-yellow-400">{ratio ?? '–'}</p>
        <p className="text-white/80">likes / participants</p>
      </div>
    </div>
  );
};

export default KPIStats;