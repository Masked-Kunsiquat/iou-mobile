import React from 'react';
import { ScrollView } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/ThemeProvider';

interface DebtLoadingProps {
  title: string;
  onBack?: () => void;
}

export function DebtLoading({ title, onBack }: DebtLoadingProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Appbar.Header statusBarHeight={insets.top}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={title} />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 16 + insets.bottom }}
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </ScrollView>
    </>
  );
}