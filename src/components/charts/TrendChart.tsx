import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { createAuthedSupabaseClient } from '../../lib/authedClient';

type TrendPoint = {
  week: string;
  participants: number;
  likes: number;
};

const TrendChart: React.FC<{ activityId: number; token: string }> = ({ activityId, token }) => {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createAuthedSupabaseClient(token);

      const { data, error } = await supabase.rpc('get_activity_trends', {
        activity_id_input: activityId,
      });

      if (error || !data) {
        console.error('Error fetching trend data:', error);
        return;
      }

      const formatted = data.map((d: any) => ({
        week: d.week.split('T')[0],
        participants: d.participants,
        likes: d.likes,
      }));

      setData(formatted);
      setLoading(false);
    };

    fetchData();
  }, [activityId, token]);

  if (loading) return <div className="text-white">Chargement des statistiques...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">Évolution des participants et likes</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="week" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="participants" stroke="#C30D9B" strokeWidth={2} />
          <Line type="monotone" dataKey="likes" stroke="#7B61FF" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;