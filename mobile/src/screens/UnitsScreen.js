import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function UnitsScreen({ route }) {
  const { propertyName } = route.params;

  return (
    <LinearGradient
      colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#1e2939',
            marginBottom: 8,
          }}
        >
          Units Screen
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#4a5565',
          }}
        >
          {propertyName}
        </Text>
      </View>
    </LinearGradient>
  );
}
