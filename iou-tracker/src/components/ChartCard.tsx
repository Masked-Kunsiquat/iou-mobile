// src/components/ChartCard.tsx
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useThemeColors } from '../theme/ThemeProvider';

type Num = number | string;

interface Props {
  title?: string;     // Optional heading shown above the row
  totalIOU: Num;      // money you owe (red)
  totalUOM: Num;      // money owed to you (green)
  showLegend?: boolean;
}

/**
 * Dependency-free stacked horizontal bar:
 *  - Green segment = UOM
 *  - Red segment   = IOU
 *  - Net (UOM - IOU) shown on the same line as "Overall Position"
 */
export default function ChartCard({
  title = 'Totals',
  totalIOU,
  totalUOM,
  showLegend = true,
}: Props) {
  const colors = useThemeColors();

  // Parse and clamp
  const { iou, uom, net, uomPct, iouPct } = useMemo(() => {
    const i = Math.max(0, Math.abs(Number(totalIOU) || 0));
    const u = Math.max(0, Math.abs(Number(totalUOM) || 0));
    const t = i + u;
    const up = t > 0 ? u / t : 0;
    const ip = t > 0 ? i / t : 0;
    return {
      iou: i,
      uom: u,
      net: Number((u - i).toFixed(2)),
      uomPct: up,
      iouPct: ip,
    };
  }, [totalIOU, totalUOM]);

  const netColor = net >= 0 ? colors.uomColor : colors.iouColor;

  return (
    <Card style={{ backgroundColor: colors.surface }}>
      <Card.Content>
        {/* Optional section title */}
        {!!title && (
          <Text variant="titleMedium" style={{ color: colors.textPrimary, marginBottom: 4 }}>
            {title}
          </Text>
        )}

        {/* Overall Position + Net on the same line */}
        <View
          style={{
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
            Overall Position
          </Text>
          <Text variant="titleMedium" style={{ color: netColor }}>
            ${Math.abs(net).toFixed(2)} {net >= 0 ? '(positive)' : '(negative)'}
          </Text>
        </View>

        {/* Bar track */}
        <View
          style={{
            height: 20,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: colors.surfaceVariant,
            borderWidth: 1,
            borderColor: colors.outline,
          }}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Totals stacked bar"
          accessibilityValue={{
            now: Math.round(uomPct * 100),
            min: 0,
            max: 100,
            text: `UOM ${Math.round(uomPct * 100)}%, IOU ${Math.round(iouPct * 100)}%`,
          }}
        >
          {/* UOM segment (green) */}
          <View
            style={{
              width: `${uomPct * 100}%`,
              height: '100%',
              backgroundColor: colors.uomColor,
            }}
          />
          {/* IOU segment (red) — overlay to avoid layout jitter */}
          <View
            style={{
              position: 'absolute',
              left: `${uomPct * 100}%`,
              width: `${iouPct * 100}%`,
              height: '100%',
              backgroundColor: colors.iouColor,
            }}
          />
        </View>

        {/* Labels under the bar */}
        <View
          style={{
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <View />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              UOM ${uom.toFixed(2)}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              IOU ${iou.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Optional legend */}
        {showLegend && (
          <View style={{ marginTop: 10, flexDirection: 'row', gap: 16 }}>
            <LegendSwatch color={colors.uomColor} label="Owed to Me (UOM)" />
            <LegendSwatch color={colors.iouColor} label="I Owe (IOU)" />
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      <Text variant="bodySmall">{label}</Text>
    </View>
  );
}
