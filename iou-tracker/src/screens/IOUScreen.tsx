import React from 'react';
import DebtsScreen from './DebtsScreen';
import { useThemeColors } from '../theme/ThemeProvider';

export default function IOUScreen(props: { onBack?: () => void }) {
  const colors = useThemeColors();
  return (
    <DebtsScreen
      type="IOU"
      title="What I Owe (IOUs)"
      totalLabel="Total"
      totalValue={(d) => d.totalIOU}
      personTotalKey="iouTotal"
      totalColor={() => colors.iouColor}
      {...props}
    />
  );
}
