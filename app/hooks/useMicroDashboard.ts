import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface NutrientSummary {
  key: string;
  label: string;
  unit: string;
  group: string;
  daily_average: number;
  rda: number;
  rda_pct: number;
  status: 'deficient' | 'low' | 'adequate' | 'excess';
}

export interface DeficiencyAlert {
  key: string;
  label: string;
  daily_average: number;
  rda: number;
  deficit_pct: number;
  days_below_50pct: number;
  total_days: number;
}

export interface MicroDashboardData {
  start_date: string;
  end_date: string;
  days_tracked: number;
  days_with_data: number;
  nutrient_score: number;
  nutrients: NutrientSummary[];
  deficiencies: DeficiencyAlert[];
  top_nutrients: NutrientSummary[];
  worst_nutrients: NutrientSummary[];
}

export function useMicroDashboard(startDate: string, endDate: string, sex: string = 'male') {
  const [data, setData] = useState<MicroDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('nutrition/micronutrient-dashboard', {
        params: { start_date: startDate, end_date: endDate, sex },
      });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data?.detail ?? 'Failed to load micronutrient data';
    }
  }, [startDate, endDate, sex]);

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
