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
const ACTION_BUTTONS_WIDTH = 80; // Width of hidden action buttons (vertical layout)

// Color palette - darker shades
const colorPalette = [
  { bg: '#c41e3a', light: '#e8495c' }, // Dark Red
  { bg: '#1f4788', light: '#3d5a9e' }, // Dark Blue
  { bg: '#0d5e1e', light: '#2d7e3e' }, // Dark Green
  { bg: '#8b4513', light: '#a0612f' }, // Dark Brown
  { bg: '#6f2da8', light: '#8b4eb8' }, // Dark Purple
  { bg: '#d4751f', light: '#e89535' }, // Dark Orange
];

function SwipeablePropertyCard({
  item,
  index,
  navigation,
  onDelete,
  onPropertyTap,
  onSwipeStateChange,
}) {
  const color = colorPalette[index % colorPalette.length];
  const [swiped, setSwiped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const animationTimeoutRef = useRef(null);

  // Notify parent whenever animation state changes
  useEffect(() => {
    onSwipeStateChange?.(isAnimating);
  }, [isAnimating, onSwipeStateChange]);

  const completeAnimation = () => {
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    // Re-enable interactions after animation fully settles (300ms animation duration)
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Matches animation duration
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // When horizontal movement is detected, lock all interactions
        if (Math.abs(gestureState.dx) > 5) {
          setIsAnimating(true);
          return true;
        }
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Constrain movement: only allow swiping left (negative), not right
        const displacement = Math.min(Math.max(gestureState.dx, -ACTION_BUTTONS_WIDTH), 0);
        pan.x.setValue(displacement);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const velocity = gestureState.vx; // Horizontal velocity
        
        // Determine if we should open or close based on threshold
        const shouldOpen = gestureState.dx < -40 || (gestureState.dx < -20 && velocity < -0.5);
        const targetValue = shouldOpen ? -ACTION_BUTTONS_WIDTH : 0;
        
        setSwiped(shouldOpen);
        
        // Animate to final position with smooth easing curve
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
    navigation.navigate('PropertyDetails', {
      propertyId: item.propertyId,
      property: item,
    });
  };

  const handleDelete = () => {
    resetSwipe();
    onDelete(item.propertyId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const truncateText = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <View
      style={{
        width: width - 32,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderRadius: 20,
      }}
    >
      {/* Hidden Action Buttons - Circular */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: ACTION_BUTTONS_WIDTH,
          backgroundColor: 'transparent',
          paddingHorizontal: 8,
          paddingVertical: 12,
          zIndex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleEdit}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
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
          <Ionicons name="pencil" size={22} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
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
          <Ionicons name="trash" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: pan.x }],
          zIndex: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (swiped) {
              // If card is swiped, close it first
              resetSwipe();
            } else {
              // Navigate only when card is fully closed
              onPropertyTap(item.propertyId, item.propertyName);
            }
          }}
          activeOpacity={1}
        >
          <LinearGradient
            colors={[color.bg, color.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              {/* Property Name */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#fafafa',
                  marginBottom: 8,
                }}
              >
                {item.propertyName}
              </Text>

              {/* Address with Location Icon */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  gap: 8,
                }}
              >
                <Ionicons
                  name="location"
                  size={14}
                  color="#e0e0e0"
                  style={{ marginTop: 1 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: '#d0d0d0',
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {truncateText(item.address?.addressText || 'No address')}
                </Text>
              </View>

              {/* Units with Border */}
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: '#e0e0e0',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  alignSelf: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="business" size={14} color="#e0e0e0" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#e0e0e0',
                  }}
                >
                  {item.unitCount} Units
                </Text>
              </View>

              {/* Swipe Hint Text */}
              <Text
                style={{
                  fontSize: 11,
                  color: '#b0b0c0',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                ← Swipe left for actions • Tap to view details
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function PropertiesListScreen({ navigation, route }) {
  const { userName, userId } = route.params;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCardSwiping, setIsCardSwiping] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyApi.getPropertiesByOwner(userId);
      setProperties(response || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await propertyApi.getPropertiesByOwner(userId);
      setProperties(response || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to refresh properties');
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const handleDeleteProperty = async (propertyId) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await propertyApi.deleteProperty(propertyId);
              fetchProperties();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const renderPropertyCard = ({ item, index }) => (
    <SwipeablePropertyCard
      item={item}
      index={index}
      navigation={navigation}
      onDelete={handleDeleteProperty}
      onSwipeStateChange={setIsCardSwiping}
      onPropertyTap={(propertyId, propertyName) =>
        navigation.navigate('Units', {
          propertyId,
          propertyName,
        })
      }
    />
  );

  const renderAddPropertyCard = () => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('PropertyDetails', {
          userId,
          isNew: true,
        })
      }
      style={{
        width: width - 32,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#a0a0b8',
        backgroundColor: '#f7f7fb',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 12,
      }}
    >
      <Ionicons name="add-circle-outline" size={44} color="#b3b3d1" />
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#6b6b8d',
          marginTop: 12,
        }}
      >
        Add Property
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: '#a0a0b8',
          marginTop: 6,
          textAlign: 'center',
        }}
      >
        {properties.length === 0
          ? 'Add first property to your portfolio'
          : 'Add another property to your portfolio'}
      </Text>
    </TouchableOpacity>
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
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e2939',
            marginBottom: 2,
          }}
        >
          Welcome, {userName}! 👋
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#4a5565',
          }}
        >
          Manage your properties
        </Text>
      </View>

      {/* Scrollable Content */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={properties}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.propertyId.toString()}
          ListFooterComponent={properties.length > 0 ? renderAddPropertyCard : null}
          ListEmptyComponent={() => (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 60,
              }}
            >
              {renderAddPropertyCard()}
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingVertical: 16,
          }}
          scrollEnabled={!isCardSwiping}
        />
      </View>
    </LinearGradient>
  );
}
