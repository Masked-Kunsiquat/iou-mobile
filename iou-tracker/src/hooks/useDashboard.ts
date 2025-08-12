import { useState, useEffect, useCallback } from 'react';
import { useLedgerStore } from '../store/ledgerStore';
import { formatMoney } from '../utils/money';

type DashboardData = {
  totalIOU: string;
  totalUOM: string;
  net: string;
  formattedIOU: string;
  formattedUOM: string;
  formattedNet: string;
  netAmount: number;
  netColor: string;
};

export function useDashboard() {
  const { dashboard, refresh } = useLedgerStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const processData = useCallback((dashboardRaw: typeof dashboard) => {
    if (!dashboardRaw) return null;

    const netAmount = parseFloat(dashboardRaw.net);
    const netColor = netAmount >= 0 ? '#4CAF50' : '#F44336';

    return {
      totalIOU: dashboardRaw.totalIOU,
      totalUOM: dashboardRaw.totalUOM,
      net: dashboardRaw.net,
      formattedIOU: formatMoney(dashboardRaw.totalIOU),
      formattedUOM: formatMoney(dashboardRaw.totalUOM),
      formattedNet: formatMoney(dashboardRaw.net),
      netAmount,
      netColor,
    };
  }, []);

  useEffect(() => {
    setData(processData(dashboard));
    setLoading(false);
  }, [dashboard, processData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await refresh();
    // Data will be updated through the dashboard effect above
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    data,
    loading,
    refresh: refreshData,
  };
}