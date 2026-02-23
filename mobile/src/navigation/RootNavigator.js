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
          name="LocationPicker"
          component={LocationPickerModal}
          options={{ title: 'Select Location' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
