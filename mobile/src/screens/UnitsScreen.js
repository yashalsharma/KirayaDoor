import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { propertyApi } from '../api/propertyApi';
import ConfirmDialog from '../components/ConfirmDialog';

function UnitCard({ item, navigation, onEdit, onDelete }) {
  // Check if unit has any active tenant linked to it
  const isOccupied = item.tenants && item.tenants.length > 0;

  return (
    <TouchableOpacity
      onPress={() => onEdit(item)}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Left Section: Icon + Info */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Unit Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#f3f4f6',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="home" size={20} color="#c41e3a" />
        </View>

        {/* Unit Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#1e2939',
              marginBottom: 2,
            }}
          >
            {item.unitName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            Tap to view actions
          </Text>
        </View>
      </View>

      {/* Middle Section: Status Badge */}
      <View
        style={{
          backgroundColor: isOccupied ? '#dcfce7' : '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginHorizontal: 12,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: isOccupied ? '#22c55e' : '#6b7280',
          }}
        >
          {isOccupied ? 'OCCUPIED' : 'VACANT'}
        </Text>
      </View>

      {/* Right Section: Delete Button */}
      <TouchableOpacity
        onPress={() => onDelete(item.unitId)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#fee2e2',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="trash" size={16} color="#dc2626" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function UnitsScreen({ navigation, route }) {
  const { propertyId, propertyName } = route.params;
  const insets = useSafeAreaInsets();
  const [units, setUnits] = useState([]);
  const [property, setProperty] = useState(null);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchPropertyAndUnits();
    }, [propertyId])
  );

  const fetchPropertyAndUnits = async () => {
    try {
      setLoading(true);
      const [propertyData, unitsData, pendingAmountData] = await Promise.all([
        propertyApi.getProperty(propertyId),
        propertyApi.getUnits(propertyId),
        propertyApi.getPendingAmount(propertyId),
      ]);
      setProperty(propertyData);
      setUnits(unitsData);
      setPendingAmount(pendingAmountData);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [propertyData, unitsData, pendingAmountData] = await Promise.all([
        propertyApi.getProperty(propertyId),
        propertyApi.getUnits(propertyId),
        propertyApi.getPendingAmount(propertyId),
      ]);
      setProperty(propertyData);
      setUnits(unitsData);
      setPendingAmount(pendingAmountData);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [propertyId]);

  const handleEditUnit = (unit) => {
    // TODO: Navigate to edit unit screen
    // Alert.alert('Edit Unit', `Editing ${unit.unitName}`);
  };

  const handleDeleteUnit = (unitId) => {
    setUnitToDelete(unitId);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    
    try {
      await propertyApi.deleteUnit(unitToDelete);
      setUnits(units.filter(u => u.unitId !== unitToDelete));
      setDeleteDialogVisible(false);
      setUnitToDelete(null);
    } catch (error) {
      setDeleteDialogVisible(false);
      setUnitToDelete(null);
      // Could show error dialog here if needed
      console.error('Error deleting unit:', error);
    }
  };

  const cancelDeleteUnit = () => {
    setDeleteDialogVisible(false);
    setUnitToDelete(null);
  };

  const truncateText = (text, maxLength = 35) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#4f39f6" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#e0e7ff', '#faf5ff', '#fce7f3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Fixed Header */}
      <View
        style={{
          backgroundColor: 'white',
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Back Button - Figma Style */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#e8e5ff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#4f39f6" />
        </TouchableOpacity>

        {/* Property Info - Center */}
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1e2939',
              marginBottom: 2,
            }}
          >
            {propertyName}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: '#9ca3af',
            }}
            numberOfLines={1}
          >
            {truncateText(property?.address?.addressText || 'No address', 30)}
          </Text>
        </View>

        {/* Property Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#e0e7ff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="home" size={22} color="#c41e3a" />
        </View>
      </View>

      {/* Scrollable Units List */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={units}
          renderItem={({ item }) => (
            <UnitCard
              item={item}
              navigation={navigation}
              onEdit={handleEditUnit}
              onDelete={handleDeleteUnit}
            />
          )}
          keyExtractor={(item) => item.unitId.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        />
      </View>

      {/* Fixed Footer */}
      <View
        style={{
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 14 + insets.bottom,
          flexDirection: 'row',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
            Total Units
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e2939' }}>
            {units.length}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
            Total Amount Due
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e2939' }}>
            ₹ {pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Unit"
        message="Are you sure you want to delete this unit? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteUnit}
        onCancel={cancelDeleteUnit}
        isDangerous={true}
      />
    </LinearGradient>
  );
}
