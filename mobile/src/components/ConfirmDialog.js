import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
}) {
  const confirmColor = isDangerous ? '#dc2626' : '#4f39f6';
  const confirmIconColor = isDangerous ? 'trash' : 'checkmark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 20,
            width: '100%',
            maxWidth: width - 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isDangerous ? '#fee2e2' : '#e8e5ff',
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
              marginBottom: 12,
            }}
          >
            <Ionicons
              name={isDangerous ? 'warning' : 'help'}
              size={24}
              color={confirmColor}
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1e2939',
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 13,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 18,
            }}
          >
            {message}
          </Text>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              justifyContent: 'flex-end',
            }}
          >
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onCancel}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#6b7280',
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: confirmColor,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#ffffff',
                }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
