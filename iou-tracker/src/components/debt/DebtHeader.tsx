import React from 'react';
import { Appbar, Card, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/ThemeProvider';

interface DebtHeaderProps {
  title: string;
  total: string;
  totalLabel: string;
  totalColor: string;
  onBack?: () => void;
}

export function DebtHeader({ title, total, totalLabel, totalColor, onBack }: DebtHeaderProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Appbar.Header statusBarHeight={insets.top}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={title} />
      </Appbar.Header>

      <Card style={{ backgroundColor: colors.surface, margin: 16, marginBottom: 8 }}>
        <Card.Content>
          <Text
            variant="headlineSmall"
            style={{ color: totalColor, textAlign: 'center' }}
          >
            {totalLabel}: ${total}
          </Text>
        </Card.Content>
      </Card>
    </>
  );
}