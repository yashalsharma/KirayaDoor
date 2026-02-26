import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { propertyApi } from '../api/propertyApi';
import ConfirmDialog from '../components/ConfirmDialog';
import BottomNavigationFooter from '../components/BottomNavigationFooter';

function UnitCard({ item, navigation, onEdit, onDelete, isEditing, editingName, onEditNameChange, onSaveEdit, onCancelEdit, isSaving }) {
  // Check if unit has any active tenant linked to it
  const isOccupied = item.tenants && item.tenants.length > 0;
  const isCurrentlyEditing = isEditing;  // isEditing is already passed as boolean correctly from parent

  return (
    <TouchableOpacity
      disabled={isCurrentlyEditing}
      onPress={() => !isCurrentlyEditing && navigation.navigate('Tenants', {
        unitId: item.unitId,
        unitName: item.unitName,
        propertyId: item.propertyId,
      })}
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
        opacity: isSaving ? 0.6 : 1,
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
          <Ionicons name="home" size={20} color="#4f39f6" />
        </View>

        {/* Unit Info */}
        <View style={{ flex: 1 }}>
          {isCurrentlyEditing ? (
            // Editing mode - TextInput
            <TextInput
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#1e2939',
                marginBottom: 2,
                padding: 4,
                borderWidth: 1,
                borderColor: '#2b7fff',
                borderRadius: 4,
              }}
              value={editingName}
              onChangeText={onEditNameChange}
              placeholder="Enter unit name"
              autoFocus
              selectTextOnFocus={false}
              selection={{ start: editingName.length, end: editingName.length }}
            />
          ) : (
            // View mode
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
          )}
          <Text
            style={{
              fontSize: 10,
              color: '#9ca3af',
            }}
          >
            {isCurrentlyEditing ? 'Press Save to update' : 'Tap to view tenants'}
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

      {/* Right Section: Edit/Save or Delete Button */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isCurrentlyEditing ? (
          <>
            {/* Save Button */}
            <TouchableOpacity
              onPress={() => onSaveEdit(item.unitId, editingName)}
              disabled={isSaving || !editingName.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isSaving ? '#d1d5db' : '#dcf5e7',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Ionicons name="checkmark" size={16} color="#059669" />
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onCancelEdit}
              disabled={isSaving}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#fee2e2',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={16} color="#dc2626" />
            </TouchableOpacity>
          </>
        ) : (
          // Edit Button
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#e0e7ff',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="pencil" size={16} color="#4f46e5" />
          </TouchableOpacity>
        )}

        {/* Delete Button */}
        {!isCurrentlyEditing && (
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
        )}
      </View>
    </TouchableOpacity>
  );
}

function AddUnitCard({ onPress, isLoading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#a0a0b8',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {/* Left Section: Icon + Info */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Add Unit Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(243, 244, 246, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: '#a0a0b8',
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="add" size={24} color="#6b7280" />
          )}
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
            Add Unit
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            Create new unit
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function UnitsScreen({ navigation, route }) {
  const { propertyId, propertyName, userId, userName } = route.params;
  const insets = useSafeAreaInsets();
  const [units, setUnits] = useState([]);
  const [property, setProperty] = useState(null);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const [originalUnitName, setOriginalUnitName] = useState('');
  const [isSavingUnit, setIsSavingUnit] = useState(false);

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
    setEditingUnitId(unit.unitId);
    setEditingUnitName(unit.unitName);
    setOriginalUnitName(unit.unitName);
  };

  const handleSaveEditUnit = async (unitId, newName) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Unit name cannot be empty');
      return;
    }

    if (newName === originalUnitName) {
      // No changes made
      setEditingUnitId(null);
      setEditingUnitName('');
      setOriginalUnitName('');
      return;
    }

    try {
      setIsSavingUnit(true);
      await propertyApi.updateUnit(unitId, { unitName: newName.trim() });
      
      // Update units array with new name
      setUnits(units.map(u => 
        u.unitId === unitId ? { ...u, unitName: newName.trim() } : u
      ));
      
      setEditingUnitId(null);
      setEditingUnitName('');
      setOriginalUnitName('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update unit name');
      console.error('Error updating unit:', error);
    } finally {
      setIsSavingUnit(false);
    }
  };

  const handleCancelEditUnit = () => {
    setEditingUnitId(null);
    setEditingUnitName('');
    setOriginalUnitName('');
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

  const handleAddUnit = async () => {
    try {
      setIsAddingUnit(true);
      const unitNumber = units.length + 1;
      const unitName = `Unit ${unitNumber}`;

      const newUnit = await propertyApi.createUnit(propertyId, {
        unitName,
      });

      if (newUnit && newUnit.unitId) {
        setUnits([...units, newUnit]);
      } else {
        Alert.alert('Error', 'Failed to create unit. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create unit');
      console.error('Error creating unit:', error);
    } finally {
      setIsAddingUnit(false);
    }
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
      <Pressable
        onPress={() => {
          // Cancel editing when tapping header
          if (editingUnitId !== null) {
            handleCancelEditUnit();
          }
        }}
      >
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
            Units
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
            <Ionicons name="home" size={22} color="#4f39f6" />
        </View>
        </View>
      </Pressable>

      {/* Scrollable Units List */}
      <Pressable
        onPress={() => {
          // Cancel editing when tapping anywhere on the list
          if (editingUnitId !== null) {
            handleCancelEditUnit();
          }
        }}
        style={{ flex: 1 }}
      >
        <FlatList
          data={units}
          renderItem={({ item }) => (
            <UnitCard
              item={item}
              navigation={navigation}
              onEdit={handleEditUnit}
              onDelete={handleDeleteUnit}
              isEditing={editingUnitId === item.unitId}
              editingName={editingUnitName}
              onEditNameChange={setEditingUnitName}
              onSaveEdit={handleSaveEditUnit}
              onCancelEdit={handleCancelEditUnit}
              isSaving={isSavingUnit}
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
          ListFooterComponent={<AddUnitCard onPress={handleAddUnit} isLoading={isAddingUnit} />}
          onScroll={() => {
            // Cancel editing when user scrolls
            if (editingUnitId !== null) {
              handleCancelEditUnit();
            }
          }}
          scrollEnabled={true}
        />
      </Pressable>

      {/* Fixed Footer */}
      <Pressable
        onPress={() => {
          // Cancel editing when tapping footer
          if (editingUnitId !== null) {
            handleCancelEditUnit();
          }
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 14,
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
      </Pressable>

      {/* Bottom Navigation Footer */}
      <BottomNavigationFooter
        activeTab="Units"
        onTabPress={(tab) => {
          if (tab === 'Property') {
            navigation.goBack();
          } else if (tab === 'Analytics') {
            // Handle analytics
          } else if (tab === 'More') {
            // Handle more options
          }
        }}
      />

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
