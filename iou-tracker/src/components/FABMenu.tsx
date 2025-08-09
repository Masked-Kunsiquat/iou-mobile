import React, { useState } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { useThemeColors } from '../theme/ThemeProvider';

interface FABMenuProps {
  onAddIOU: () => void;
  onAddUOM: () => void;
  onAddContact: () => void;
}

export default function FABMenu({ onAddIOU, onAddUOM, onAddContact }: FABMenuProps) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible={true}
        icon={open ? 'close' : 'plus'}
        actions={[
          {
            icon: 'account-plus',
            label: 'Add Contact',
            onPress: onAddContact,
            color: colors.primary, // accent with theme primary
          },
          {
            icon: 'arrow-up-circle',
            label: 'Add UOM (They owe me)',
            onPress: onAddUOM,
            color: colors.uomColor, // themed UOM color
          },
          {
            icon: 'arrow-down-circle',
            label: 'Add IOU (I owe them)',
            onPress: onAddIOU,
            color: colors.iouColor, // themed IOU color
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        // Let Paper handle FAB background/labels via theme; only positioning here.
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
      />
    </Portal>
  );
}
