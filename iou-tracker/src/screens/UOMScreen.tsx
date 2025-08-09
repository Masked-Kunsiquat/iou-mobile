import React from 'react';
import DebtsScreen from './DebtsScreen';
import { useThemeColors } from '../theme/ThemeProvider';

export default function UOMScreen(props: { onBack?: () => void }) {
  const colors = useThemeColors();
  return (
    <DebtsScreen
      type="UOM"
      title="Owed to Me (UOMs)"
      totalLabel="Total"
      totalValue={(d) => d.totalUOM}
      personTotalKey="uomTotal"
      totalColor={() => colors.uomColor}
      {...props}
    />
  );
}
