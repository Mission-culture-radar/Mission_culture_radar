import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TrendChart from './charts/TrendChart';
import GenderChart from './charts/GenderChart';
import KPIStats from './charts/KPIStats';

const ActivityCharts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  if (!id || !token) return null;

  return (
    <div className="mt-12 space-y-16">
      <TrendChart activityId={Number(id)} token={token} />
      <GenderChart activityId={Number(id)} token={token} />
      <KPIStats activityId={Number(id)} token={token} />
      {/* Add more widgets here like ClickChart, AgeChart, etc. */}
    </div>
  );
};

export default ActivityCharts;