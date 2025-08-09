import React, { useState } from 'react';
import { FAB, Portal } from 'react-native-paper';

interface FABMenuProps {
  onAddIOU: () => void;
  onAddUOM: () => void;
  onAddContact: () => void;
}

export default function FABMenu({ onAddIOU, onAddUOM, onAddContact }: FABMenuProps) {
  const [open, setOpen] = useState(false);

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
          },
          {
            icon: 'arrow-up-circle',
            label: 'Add UOM (They owe me)',
            onPress: onAddUOM,
          },
          {
            icon: 'arrow-down-circle',
            label: 'Add IOU (I owe them)',
            onPress: onAddIOU,
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
      />
    </Portal>
  );
}