import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, Provider as PaperProvider } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';

export default function Dashboard() {
  const { dashboard, people, refresh } = useLedgerStore();

  useEffect(() => { refresh(); }, []);

  return (
    <PaperProvider>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1 }}><Card.Content>
            <Text variant="titleSmall">Total I Owe (IOU)</Text>
            <Text variant="headlineSmall">${dashboard?.totalIOU ?? '0.00'}</Text>
          </Card.Content></Card>
          <Card style={{ flex: 1 }}><Card.Content>
            <Text variant="titleSmall">Total Owed to Me (UOM)</Text>
            <Text variant="headlineSmall">${dashboard?.totalUOM ?? '0.00'}</Text>
          </Card.Content></Card>
          <Card style={{ flex: 1 }}><Card.Content>
            <Text variant="titleSmall">Net (UOM − IOU)</Text>
            <Text variant="headlineSmall">${dashboard?.net ?? '0.00'}</Text>
          </Card.Content></Card>
        </View>

        <Card>
          <Card.Title title="People" />
          <Card.Content style={{ gap: 8 }}>
            {people.map(p => (
              <View key={p.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text variant="titleMedium">{p.name}</Text>
                <Text>IOU: ${p.iouTotal}   UOM: ${p.uomTotal}   Net: ${p.net}</Text>
              </View>
            ))}
            {people.length === 0 && <Text>No people yet.</Text>}
          </Card.Content>
        </Card>
      </ScrollView>
    </PaperProvider>
  );
}
