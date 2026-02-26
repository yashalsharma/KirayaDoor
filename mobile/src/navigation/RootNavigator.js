import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SelectionScreen from '../screens/SelectionScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import UserTypeSelectionScreen from '../screens/UserTypeSelectionScreen';
import OwnerPropertyScreen from '../screens/OwnerPropertyScreen';
import PropertiesListScreen from '../screens/PropertiesListScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import UnitsScreen from '../screens/UnitsScreen';
import TenantsScreen from '../screens/TenantsScreen';
import AddTenantScreen from '../screens/AddTenantScreen';
import TenantStatementScreen from '../screens/TenantStatementScreen';
import EditTenantDetailsSheet from '../screens/EditTenantDetailsSheet';
import AddExpenseSheet from '../screens/AddExpenseSheet';
import RecordPaymentSheet from '../screens/RecordPaymentSheet';
import LocationPickerModal from '../screens/LocationPickerModal';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Selection"
          component={SelectionScreen}
          options={{ title: 'Welcome' }}
        />
        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
          options={{ title: 'Verify OTP' }}
        />
        <Stack.Screen
          name="UserTypeSelection"
          component={UserTypeSelectionScreen}
          options={{ title: 'Select Role' }}
        />
        <Stack.Screen
          name="OwnerProperty"
          component={OwnerPropertyScreen}
          options={{ title: 'Owner Details' }}
        />
        <Stack.Screen
          name="PropertiesList"
          component={PropertiesListScreen}
          options={{ title: 'My Properties' }}
        />
        <Stack.Screen
          name="PropertyDetails"
          component={PropertyDetailsScreen}
          options={{ title: 'Property Details' }}
        />
        <Stack.Screen
          name="Units"
          component={UnitsScreen}
          options={{ title: 'Units' }}
        />
        <Stack.Screen
          name="Tenants"
          component={TenantsScreen}
          options={{ title: 'Tenants' }}
        />
        <Stack.Screen
          name="AddTenant"
          component={AddTenantScreen}
          options={{ title: 'Add Tenant' }}
        />
        <Stack.Screen
          name="TenantStatement"
          component={TenantStatementScreen}
          options={{ title: 'Tenant Statement' }}
        />
        <Stack.Screen
          name="EditTenantDetails"
          component={EditTenantDetailsSheet}
          options={{ title: 'Edit Tenant Details' }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseSheet}
          options={{ title: 'Add Expense' }}
        />
        <Stack.Screen
          name="RecordPayment"
          component={RecordPaymentSheet}
          options={{ title: 'Record Payment' }}
        />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerModal}
          options={{ title: 'Select Location' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
