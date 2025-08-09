import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, Provider as PaperProvider, Appbar } from 'react-native-paper';
import { useLedgerStore } from '../store/ledgerStore';

interface IOUScreenProps {
  onBack?: () => void;
}

export default function IOUScreen({ onBack }: IOUScreenProps) {
  const { dashboard, people, refresh } = useLedgerStore();

  useEffect(() => { refresh(); }, []);

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="What I Owe (IOUs)" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#d32f2f', textAlign: 'center' }}>
              Total: ${dashboard?.totalIOU ?? '0.00'}
            </Text>
          </Card.Content>
        </Card>

        <Card>
          <Card.Title title="People I Owe Money To" />
          <Card.Content style={{ gap: 8 }}>
            {people
              .filter(p => parseFloat(p.iouTotal) > 0)
              .map(p => (
                <View 
                  key={p.id} 
                  style={{ 
                    paddingVertical: 12, 
                    borderBottomWidth: 1, 
                    borderColor: '#eee',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text variant="titleMedium">{p.name}</Text>
                  <Text variant="titleMedium" style={{ color: '#d32f2f' }}>
                    ${p.iouTotal}
                  </Text>
                </View>
              ))
            }
            {people.filter(p => parseFloat(p.iouTotal) > 0).length === 0 && (
              <Text style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                You don't owe anyone money! 🎉
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </PaperProvider>
  );
}