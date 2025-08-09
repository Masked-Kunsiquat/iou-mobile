import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { TextInput, Menu, List, Text } from 'react-native-paper';
import { useThemeColors } from '../theme/ThemeProvider';
import { Person } from '../models/types';

type Props = {
  people: Person[];
  value: string | undefined;
  onChange: (id: string) => void;
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
    <Pressable onPress={() => !disabled && setOpen(true)} accessibilityRole="button">
      <TextInput
        label={label}
        value={selected ? selected.name : ''}
        editable={false}             // display-only; press handled by Pressable
        pointerEvents="none"         // ensures Pressable gets the touch
        right={
          <TextInput.Icon
            icon={open ? 'menu-up' : 'menu-down'}
            onPress={() => !disabled && setOpen((v) => !v)}
          />
        }
        mode="outlined"
        outlineColor={colors.outline}
        activeOutlineColor={colors.primary}
        placeholderTextColor={colors.textSecondary}
      />
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
        // Optional: keep taps for scrolling in the list
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
