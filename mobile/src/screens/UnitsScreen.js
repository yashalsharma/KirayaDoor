import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { propertyApi } from '../api/propertyApi';

const { width } = Dimensions.get('window');
const ACTION_BUTTONS_WIDTH = 110; // Width of hidden action buttons (horizontal layout)

function SwipeableUnitCard({
  item,
  index,
  navigation,
  onDelete,
  propertyId,
  onSwipeStateChange,
}) {
  const [swiped, setSwiped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const animationTimeoutRef = useRef(null);

  // Check if unit has tenants
  const isOccupied = item.tenants && item.tenants.length > 0;

  useEffect(() => {
    onSwipeStateChange?.(isAnimating);
  }, [isAnimating, onSwipeStateChange]);

  const completeAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 5) {
          setIsAnimating(true);
          return true;
        }
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        const displacement = Math.min(Math.max(gestureState.dx, -ACTION_BUTTONS_WIDTH), 0);
        pan.x.setValue(displacement);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const velocity = gestureState.vx;
        const shouldOpen = gestureState.dx < -50 || (gestureState.dx < -30 && velocity < -0.5);
        const targetValue = shouldOpen ? -ACTION_BUTTONS_WIDTH : 0;
        
        setSwiped(shouldOpen);
        
        Animated.timing(pan.x, {
          toValue: targetValue,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }).start(completeAnimation);
      },
    })
  ).current;

  const resetSwipe = () => {
    setSwiped(false);
    setIsAnimating(true);
    Animated.timing(pan.x, {
      toValue: 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(completeAnimation);
  };

  const handleEdit = () => {
    resetSwipe();
    // TODO: Navigate to edit unit screen
    Alert.alert('Edit', `Editing ${item.unitName}`);
  };

  const handleDelete = () => {
    resetSwipe();
    onDelete(item.unitId);
  };

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View
      style={{
        width: width - 32,
        marginBottom: 12,
        overflow: 'hidden',
        borderRadius: 16,
        position: 'relative',
      }}
    >
      {/* Hidden Action Buttons - Horizontal */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: ACTION_BUTTONS_WIDTH,
          backgroundColor: 'transparent',
          paddingHorizontal: 6,
          paddingVertical: 12,
          zIndex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <TouchableOpacity
          onPress={handleEdit}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#2563eb',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="pencil" size={18} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#dc2626',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="trash" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: pan.x }],
          zIndex: 2,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (swiped) {
              resetSwipe();
            } else {
              // TODO: Navigate to unit details when tapping card
              Alert.alert('Unit Details', `Viewing ${item.unitName}`);
            }
          }}
          activeOpacity={1}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
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
              <Ionicons name="home" size={20} color="#6b7280" />
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
                Tap to edit
              </Text>
            </View>

            {/* Status Badge */}
            <View
              style={{
                backgroundColor: isOccupied ? '#dcfce7' : '#f3f4f6',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
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
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function UnitsScreen({ navigation, route }) {
  const { propertyId, propertyName } = route.params;
  const [units, setUnits] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCardSwiping, setIsCardSwiping] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPropertyAndUnits();
    }, [propertyId])
  );

  const fetchPropertyAndUnits = async () => {
    try {
      setLoading(true);
      const propertyData = await propertyApi.getProperty(propertyId);
      setProperty(propertyData);
      // TODO: Fetch units for this property
      // For now, use mock data
      setUnits([
        { unitId: 1, unitName: 'Unit 1', propertyId, tenants: [] },
        { unitId: 2, unitName: 'Unit 2', propertyId, tenants: [{ tenantId: 1 }] },
        { unitId: 3, unitName: 'Unit 3', propertyId, tenants: [] },
        { unitId: 4, unitName: 'Unit 4', propertyId, tenants: [{ tenantId: 2 }, { tenantId: 3 }] },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const propertyData = await propertyApi.getProperty(propertyId);
      setProperty(propertyData);
      // TODO: Fetch units for this property
      setUnits([
        { unitId: 1, unitName: 'Unit 1', propertyId, tenants: [] },
        { unitId: 2, unitName: 'Unit 2', propertyId, tenants: [{ tenantId: 1 }] },
        { unitId: 3, unitName: 'Unit 3', propertyId, tenants: [] },
        { unitId: 4, unitName: 'Unit 4', propertyId, tenants: [{ tenantId: 2 }, { tenantId: 3 }] },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [propertyId]);

  const handleDeleteUnit = async (unitId) => {
    Alert.alert(
      'Delete Unit',
      'Are you sure you want to delete this unit?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // TODO: Call API to delete unit
              setUnits(units.filter(u => u.unitId !== unitId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete unit');
            }
          },
        },
      ]
    );
  };

  const truncateText = (text, maxLength = 35) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderUnitCard = ({ item }) => (
    <SwipeableUnitCard
      item={item}
      index={units.indexOf(item)}
      navigation={navigation}
      onDelete={handleDeleteUnit}
      propertyId={propertyId}
      onSwipeStateChange={setIsCardSwiping}
    />
  );

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
          <Ionicons name="home" size={22} color="#4f39f6" />
        </View>
      </View>

      {/* Scrollable Units List */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={units}
          renderItem={renderUnitCard}
          keyExtractor={(item) => item.unitId.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          scrollEnabled={!isCardSwiping}
        />
      </View>

      {/* Fixed Footer */}
      <View
        style={{
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingVertical: 14,
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
            ₹ 0
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
