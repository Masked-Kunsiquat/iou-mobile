import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { TextInput, Menu, List, Text } from 'react-native-paper';
import { useThemeColors } from '../theme/ThemeProvider';
import { Person } from '../models/types';

type Props = {
  people: Person[];
  value: Person['id'] | undefined; // use domain ID type
  onChange: (id: Person['id']) => void; // enforce correct ID type
  label?: string;
  disabled?: boolean;
};

export default function ThemedPersonSelect({
  people,
  value,
  onChange,
  label = 'Person',
  disabled,
}: Props) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => people.find((p) => p.id === value), [people, value]);

  const anchor = (
    <Pressable
      onPress={() => !disabled && setOpen(true)}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
    >
      <View pointerEvents={disabled ? 'none' : 'auto'}>
        <TextInput
          label={label}
          value={selected ? selected.name : ''}
          editable={false} // display-only; press handled by Pressable
          right={
            <TextInput.Icon
              icon={open ? 'menu-up' : 'menu-down'}
              onPress={() => !disabled && setOpen((v) => !v)}
              disabled={disabled}
            />
          }
          mode="outlined"
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </Pressable>
  );

  return (
    <View>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={anchor}
        contentStyle={{
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          borderWidth: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView style={{ maxHeight: 300, backgroundColor: colors.surface }}>
          {people.map((p) => (
            <Menu.Item
              key={p.id}
              title={p.name}
              onPress={() => {
                onChange(p.id);
                setOpen(false);
              }}
              leadingIcon={p.id === value ? 'check' : undefined}
            />
          ))}
          {people.length === 0 && (
            <View style={{ padding: 12 }}>
              <Text style={{ color: colors.textSecondary }}>No contacts found</Text>
            </View>
          )}
        </ScrollView>
      </Menu>
    </View>
  );
}
