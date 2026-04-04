import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import type { LiveStatus, EnergyReading, EnergySummary } from '@solar-monitor/shared';
import { DASHBOARD_REFRESH_MS } from '@solar-monitor/shared';

export function useEnergyData(period: string = 'day') {
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [history, setHistory] = useState<EnergyReading[] | null>(null);
  const [summary, setSummary] = useState<EnergySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch live status with polling
  useEffect(() => {
    async function fetchLive() {
      try {
        const result = await api.get<{ data: LiveStatus }>('/api/energy/live');
        setLiveStatus(result.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch live data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLive();
    intervalRef.current = setInterval(fetchLive, DASHBOARD_REFRESH_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Fetch historical data when period changes
  useEffect(() => {
    async function fetchHistory() {
      try {
        const [historyRes, summaryRes] = await Promise.all([
          api.get<{ data: { timeSeries: EnergyReading[] } }>(`/api/energy/history?period=${period}`),
          api.get<{ data: EnergySummary }>(`/api/energy/summary?period=${period}`),
        ]);
        setHistory(historyRes.data.timeSeries);
        setSummary(summaryRes.data);
      } catch {
        // Keep existing data on error
      }
    }

    fetchHistory();
  }, [period]);

  return { liveStatus, history, summary, isLoading, error };
}
