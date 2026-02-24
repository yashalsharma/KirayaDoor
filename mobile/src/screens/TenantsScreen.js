import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { propertyApi } from '../api/propertyApi';
import ConfirmDialog from '../components/ConfirmDialog';
import BottomNavigationFooter from '../components/BottomNavigationFooter';

function TenantCard({ item, navigation, onDelete, onEdit }) {
  const amountDue = item.amountDue;
  const isLoading = amountDue === null || amountDue === undefined;
  const isAmountDueZero = amountDue === 0;

  return (
    <TouchableOpacity
      disabled={true}
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
        {/* Tenant Icon */}
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
          <Ionicons name="person" size={20} color="#c41e3a" />
        </View>

        {/* Tenant Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#1e2939',
              marginBottom: 2,
            }}
          >
            {item.tenantName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9ca3af',
            }}
            numberOfLines={1}
          >
            {item.tenantContactNumber || 'No contact'}
          </Text>
        </View>
      </View>

      {/* Middle Section: Amount Due Badge */}
      <View
        style={{
          backgroundColor: isLoading ? '#f3f4f6' : (isAmountDueZero ? '#dcfce7' : '#fee2e2'),
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginHorizontal: 12,
          minWidth: 60,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: isLoading ? '#9ca3af' : (isAmountDueZero ? '#22c55e' : '#dc2626'),
          }}
        >
          {isLoading ? '₹ ...' : `₹ ${amountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        </Text>
      </View>

      {/* Right Section: Edit and Delete Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
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

        <TouchableOpacity
          onPress={() => onDelete(item.tenantId)}
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
      </View>
    </TouchableOpacity>
  );
}

function TenantDivider({ label }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        marginHorizontal: 16,
        gap: 12,
      }}
    >
      <View
        style={{
          flex: 1,
          height: 1,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#d1d5db',
        }}
      />
      <Text
        style={{
          fontSize: 12,
          color: '#9ca3af',
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          height: 1,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#d1d5db',
        }}
      />
    </View>
  );
}

function AddTenantCard({ onPress, isLoading }) {
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
        gap: 12,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {/* Left Section: Icon + Info */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Add Tenant Icon */}
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

        {/* Tenant Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#1e2939',
              marginBottom: 2,
            }}
          >
            Add Tenant
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            Add new tenant
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TenantsScreen({ navigation, route }) {
  const { unitId, unitName, propertyId } = route.params || {};
  const insets = useSafeAreaInsets();
  const [tenants, setTenants] = useState([]);
  const [allAmountsLoaded, setAllAmountsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  // Calculate total amount due for the unit by summing all tenant amounts
  const calculateTotalUnitAmountDue = () => {
    return tenants.reduce((sum, tenant) => {
      return sum + (tenant.amountDue ?? 0);
    }, 0);
  };

  // Check if all tenant amounts have been loaded
  const areAllAmountsLoaded = () => {
    return tenants.length > 0 && tenants.every(t => t.amountDue !== null && t.amountDue !== undefined);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTenants();
    }, [unitId, propertyId])
  );

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      // Step 1: Fetch units + tenants (fast)
      const unitsData = await propertyApi.getUnits(propertyId);
      const unit = unitsData.find(u => u.unitId === unitId);
      
      // Sort tenants: active first, then inactive
      const sortedTenants = (unit?.tenants || []).map(t => ({
        ...t,
        amountDue: null // Initialize with null for skeleton loading
      })).sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
      });
      
      setTenants(sortedTenants);
      setAllAmountsLoaded(false);
      
      // Step 2: Fetch pending amounts for each tenant in parallel batches (5 at a time)
      const fetchPendingAmountsInBatches = async (tenantsList) => {
        const batchSize = 5;
        const updatedTenants = [...tenantsList];
        
        for (let i = 0; i < tenantsList.length; i += batchSize) {
          const batch = tenantsList.slice(i, i + batchSize);
          
          // Fetch all amounts in this batch in parallel
          const batchPromises = batch.map(tenant =>
            propertyApi.getTenantPendingAmount(tenant.tenantId)
              .then(amount => ({
                tenantId: tenant.tenantId,
                amount: amount
              }))
              .catch(err => {
                console.log(`Failed to fetch amount for tenant ${tenant.tenantId}:`, err);
                return { tenantId: tenant.tenantId, amount: 0 };
              })
          );
          
          // Wait for this batch to complete
          const results = await Promise.all(batchPromises);
          
          // Update the tenants with the fetched amounts
          results.forEach(result => {
            const tenantIndex = updatedTenants.findIndex(t => t.tenantId === result.tenantId);
            if (tenantIndex >= 0) {
              updatedTenants[tenantIndex] = {
                ...updatedTenants[tenantIndex],
                amountDue: result.amount
              };
            }
          });
          
          // Update state after each batch completes to show progressive loading
          setTenants([...updatedTenants]);
        }
        
        // Mark all amounts as loaded
        setAllAmountsLoaded(true);
        return updatedTenants;
      };
      
      // Start fetching amounts asynchronously (non-blocking)
      if (sortedTenants.length > 0) {
        await fetchPendingAmountsInBatches(sortedTenants);
      } else {
        setAllAmountsLoaded(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Step 1: Fetch units + tenants (fast)
      const unitsData = await propertyApi.getUnits(propertyId);
      const unit = unitsData.find(u => u.unitId === unitId);
      
      // Sort tenants: active first, then inactive
      const sortedTenants = (unit?.tenants || []).map(t => ({
        ...t,
        amountDue: null // Initialize with null for skeleton loading
      })).sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
      });
      
      setTenants(sortedTenants);
      setAllAmountsLoaded(false);
      
      // Step 2: Fetch pending amounts for each tenant in parallel batches (5 at a time)
      const fetchPendingAmountsInBatches = async (tenantsList) => {
        const batchSize = 5;
        const updatedTenants = [...tenantsList];
        
        for (let i = 0; i < tenantsList.length; i += batchSize) {
          const batch = tenantsList.slice(i, i + batchSize);
          
          // Fetch all amounts in this batch in parallel
          const batchPromises = batch.map(tenant =>
            propertyApi.getTenantPendingAmount(tenant.tenantId)
              .then(amount => ({
                tenantId: tenant.tenantId,
                amount: amount
              }))
              .catch(err => {
                console.log(`Failed to fetch amount for tenant ${tenant.tenantId}:`, err);
                return { tenantId: tenant.tenantId, amount: 0 };
              })
          );
          
          // Wait for this batch to complete
          const results = await Promise.all(batchPromises);
          
          // Update the tenants with the fetched amounts
          results.forEach(result => {
            const tenantIndex = updatedTenants.findIndex(t => t.tenantId === result.tenantId);
            if (tenantIndex >= 0) {
              updatedTenants[tenantIndex] = {
                ...updatedTenants[tenantIndex],
                amountDue: result.amount
              };
            }
          });
          
          // Update state after each batch completes to show progressive loading
          setTenants([...updatedTenants]);
        }
        
        // Mark all amounts as loaded
        setAllAmountsLoaded(true);
        return updatedTenants;
      };
      
      // Start fetching amounts asynchronously (non-blocking)
      if (sortedTenants.length > 0) {
        await fetchPendingAmountsInBatches(sortedTenants);
      } else {
        setAllAmountsLoaded(true);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to refresh tenants');
    } finally {
      setRefreshing(false);
    }
  }, [unitId, propertyId]);

  const handleDeleteTenant = (tenantId) => {
    setTenantToDelete(tenantId);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    
    try {
      await propertyApi.deleteTenant(tenantToDelete);
      setTenants(tenants.filter(t => t.tenantId !== tenantToDelete));
      setDeleteDialogVisible(false);
      setTenantToDelete(null);
    } catch (error) {
      setDeleteDialogVisible(false);
      setTenantToDelete(null);
      console.error('Error deleting tenant:', error);
    }
  };

  const cancelDeleteTenant = () => {
    setDeleteDialogVisible(false);
    setTenantToDelete(null);
  };

  const handleEditTenant = (tenant) => {
    // TODO: Navigate to edit tenant screen
    Alert.alert('Edit Tenant', `Editing ${tenant.tenantName}`);
  };

  const handleAddTenant = async () => {
    // TODO: Navigate to add tenant screen
    Alert.alert('Add Tenant', 'Add tenant feature coming soon');
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
          // No action on header press
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

          {/* Unit Info - Center */}
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#1e2939',
                marginBottom: 2,
              }}
            >
              {unitName}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: '#9ca3af',
              }}
              numberOfLines={1}
            >
              Tenants
            </Text>
          </View>

          {/* Unit Icon */}
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
      </Pressable>

      {/* Scrollable Tenants List */}
      <Pressable
        onPress={() => {
          // No action on list press
        }}
        style={{ flex: 1 }}
      >
        <FlatList
          data={tenants}
          renderItem={({ item, index }) => {
            // Check if this is the first inactive tenant
            const activeTenants = tenants.filter(t => t.isActive);
            const isFirstInactive = !item.isActive && index === activeTenants.length;
            
            return (
              <View>
                {isFirstInactive && tenants.some(t => t.isActive) && (
                  <TenantDivider label="Inactive Tenants" />
                )}
                <TenantCard
                  item={item}
                  navigation={navigation}
                  onDelete={handleDeleteTenant}
                  onEdit={handleEditTenant}
                />
              </View>
            );
          }}
          keyExtractor={(item) => item.tenantId.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          ListFooterComponent={<AddTenantCard onPress={handleAddTenant} isLoading={isAddingTenant} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="person-outline" size={60} color="#d1d5db" />
              <Text 
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#9ca3af',
                  marginTop: 12,
                }}
              >
                No tenants yet
              </Text>
            </View>
          }
        />
      </Pressable>

      {/* Fixed Footer */}
      <Pressable
        onPress={() => {
          // No action on footer press
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
              Active Tenants
            </Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e2939' }}>
              {tenants.filter(t => t.isActive).length}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
              Total Amount Due
            </Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e2939' }}>
              {allAmountsLoaded
                ? `₹ ${calculateTotalUnitAmountDue().toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                : '₹ ...'}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Bottom Navigation Footer */}
      <BottomNavigationFooter
        activeTab="Property"
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
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTenant}
        onCancel={cancelDeleteTenant}
        isDangerous={true}
      />
    </LinearGradient>
  );
}
