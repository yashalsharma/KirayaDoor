import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_COLOR = '#2b7fff';
const INACTIVE_COLOR = '#9ca3af';

export default function BottomNavigationFooter({
  activeTab = 'Property',
  onTabPress,
}) {
  const tabs = [
    { name: 'Property', icon: 'home', label: 'Property' },
    { name: 'Analytics', icon: 'bar-chart', label: 'Analytics' },
    { name: 'More', icon: 'ellipsis-horizontal', label: 'More' },
  ];

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: 8,
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        const iconColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
        const textColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => onTabPress?.(tab.name)}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              paddingHorizontal: 16,
              flex: 1,
            }}
          >
            <Ionicons name={tab.icon} size={24} color={iconColor} />
            <Text
              style={{
                fontSize: 12,
                color: textColor,
                fontWeight: isActive ? '600' : '400',
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
