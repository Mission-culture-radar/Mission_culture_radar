import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { createAuthedSupabaseClient } from '../../lib/authedClient';

type GenderData = {
  name: string;
  count: number;
};

const COLORS = ['#C30D9B', '#7B61FF', '#FFB700', '#00C49F', '#FF4444'];

const GenderChart: React.FC<{ activityId: number; token: string }> = ({ activityId, token }) => {
  const [data, setData] = useState<GenderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenderData = async () => {
      const supabase = createAuthedSupabaseClient(token);

      const { data, error } = await supabase.rpc('get_gender_distribution', {
        activity_id_input: activityId,
      });

      if (error || !data) {
        console.error('Error fetching gender data:', error);
        return;
      }

      setData(data);
      setLoading(false);
    };

    fetchGenderData();
  }, [activityId, token]);

  if (loading) return <div className="text-white">Chargement des genres...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4">Répartition par genre</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="count"
            isAnimationActive={true}
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => entry.name}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenderChart;