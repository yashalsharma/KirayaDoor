import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

// Google API Key - Already configured
const GOOGLE_API_KEY = 'AIzaSyAQNfSaWoHpBmK928MMM0jZ45aGqVtVLyE';

export default function LocationPickerModal({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });
  const webViewRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setMapCenter(coords);
      setSelectedCoordinates(coords);

      // Fetch address from Google Geocoding API
      await fetchAddressFromCoordinates(coords.latitude, coords.longitude);

      // Center map on current location and show current location marker
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `window.setMapCenter(${coords.latitude}, ${coords.longitude}); window.setCurrentLocation(${coords.latitude}, ${coords.longitude});`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlaces = async (query) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Clear existing search timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Debounce search - wait 300ms before making the API call
    searchTimerRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&key=${GOOGLE_API_KEY}&components=country:in&sessiontoken=12345`
        );
        const data = await response.json();

        if (data.predictions && data.predictions.length > 0) {
          // Log to check what fields are in the response
          console.log('API Response:', data.predictions[0]);
          setSearchResults(data.predictions);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const getPlaceDetails = async (placeId) => {
    try {
      setSearchLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&fields=formatted_address,geometry`
      );
      const data = await response.json();

      if (data.result) {
        const result = data.result;
        const address = result.formatted_address;
        const coords = {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        };

        setSelectedAddress(address);
        setSelectedCoordinates(coords);
        setSearchQuery(address);
        setMapCenter(coords);
        setShowResults(false);
        setSearchResults([]);
        Keyboard.dismiss();

        // Center map on selected location
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.setMapCenter(${coords.latitude}, ${coords.longitude}, true);`
          );
        }
      }
    } catch (error) {
      console.error('Details error:', error);
      Alert.alert('Error', 'Failed to get place details');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapClick = (latitude, longitude) => {
    setSelectedCoordinates({ latitude, longitude });
    setMapCenter({ latitude, longitude });

    // Debounce: clear existing timer and set a new one
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Wait 1 second, then fetch address
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressFromCoordinates(latitude, longitude);
    }, 1000);
  };

  const handleMarkerDrag = (latitude, longitude) => {
    setSelectedCoordinates({ latitude, longitude });
    setMapCenter({ latitude, longitude });

    // Debounce: clear existing timer and set a new one
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Wait 1 second after drag ends, then fetch address
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressFromCoordinates(latitude, longitude);
    }, 1000);
  };

  const fetchAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setSelectedAddress(address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedAddress || !selectedCoordinates) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    // Get the original route params to preserve them
    const originalParams = route.params?.originalRoute || {};

    // Navigate back to PropertyDetails with the selected location data and original params
    navigation.navigate('PropertyDetails', {
      ...originalParams,
      selectedAddress: selectedAddress,
      selectedCoordinates: selectedCoordinates,
    });
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places"></script>
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #map {
          height: 100%;
          width: 100%;
        }
        .center-marker {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          font-size: 40px;
          z-index: 999;
          pointer-events: none;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="center-marker">📍</div>
      <script>
        let map;
        let marker;
        let currentLocationMarker;
        const initialLat = ${mapCenter.latitude};
        const initialLon = ${mapCenter.longitude};
        
        function createCurrentLocationMarker() {
          // Create a custom blue dot for current location
          const svgMarker = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4A90E2',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          };
          return svgMarker;
        }
        
        function initMap() {
          map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: { lat: initialLat, lng: initialLon },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: false,
            streetViewControl: false,
          });
          
          // Create red/orange marker for selected location
          marker = new google.maps.Marker({
            map: map,
            position: { lat: initialLat, lng: initialLon },
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            zIndex: 10,
            draggable: true,
          });
          
          // Listen for marker drag events
          marker.addListener('drag', function() {
            const lat = marker.getPosition().lat();
            const lng = marker.getPosition().lng();
            map.setCenter({ lat: lat, lng: lng });
          });
          
          marker.addListener('dragend', function() {
            const lat = marker.getPosition().lat();
            const lng = marker.getPosition().lng();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerDrag',
              latitude: lat,
              longitude: lng
            }));
          });
          
          // Create blue dot for current location
          currentLocationMarker = new google.maps.Marker({
            map: map,
            position: { lat: initialLat, lng: initialLon },
            icon: createCurrentLocationMarker(),
            title: 'Your current location',
            zIndex: 5,
          });
          
          map.addListener('click', function(e) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updateMarker(lat, lng);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              latitude: lat,
              longitude: lng
            }));
          });
        }
        
        window.setMapCenter = function(lat, lon, addMarker) {
          if (map) {
            map.setCenter({ lat: lat, lng: lon });
            map.setZoom(15);
            if (addMarker || marker) {
              if (marker) {
                marker.setPosition({ lat: lat, lng: lon });
              } else {
                marker = new google.maps.Marker({
                  map: map,
                  position: { lat: lat, lng: lon },
                  icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  zIndex: 10,
                });
              }
            }
          }
        };
        
        window.setCurrentLocation = function(lat, lon) {
          if (map && currentLocationMarker) {
            currentLocationMarker.setPosition({ lat: lat, lng: lon });
          }
        };
        
        window.updateMarker = function(lat, lng) {
          if (marker) {
            marker.setPosition({ lat: lat, lng: lng });
          } else {
            marker = new google.maps.Marker({
              map: map,
              position: { lat: lat, lng: lng },
              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              zIndex: 10,
            });
          }
          map.setCenter({ lat: lat, lng: lng });
        };
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initMap);
        } else {
          initMap();
        }
      </script>
    </body>
    </html>
  `;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#4f39f6" />
          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            Getting your location...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1e2939" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#1e2939',
          }}
        >
          Select Location
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map View */}
      <View style={{ flex: 1, position: 'relative' }}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          onMessage={(event) => {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'mapClick') {
              handleMapClick(data.latitude, data.longitude);
            } else if (data.type === 'markerDrag') {
              handleMarkerDrag(data.latitude, data.longitude);
            }
          }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
        />

        {/* Search Bar Overlay */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            right: 16,
            zIndex: 100,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              paddingHorizontal: 12,
              gap: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 12,
                fontSize: 14,
                color: '#1e2939',
              }}
              placeholder="Search for an address..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPlaces(text);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
            {searchLoading && (
              <ActivityIndicator size="small" color="#4f39f6" />
            )}
          </View>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 62,
                left: 16,
                right: 16,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                maxHeight: 300,
                zIndex: 101,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <ScrollView
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.place_id}-${index}`}
                    onPress={() => {
                      console.log('Clicked:', item.description || item.main_text);
                      getPlaceDetails(item.place_id);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      borderBottomWidth:
                        index < searchResults.length - 1 ? 1 : 0,
                      borderBottomColor: '#e5e7eb',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color="#4f39f6"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: 4,
                        }}
                      >
                        {item.description || item.main_text || 'Location'}
                      </Text>
                      {item.secondary_text && (
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 13,
                            color: '#64748b',
                          }}
                        >
                          {item.secondary_text}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Current Location Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 16,
            backgroundColor: 'white',
            borderRadius: 50,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            zIndex: 15,
          }}
        >
          <Ionicons name="locate" size={24} color="#4f39f6" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet with Location Info and Confirm Button */}
      <View
        style={{
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 24,
        }}
      >
        {selectedCoordinates ? (
          <>
            {selectedAddress && (
              <View
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    marginBottom: 4,
                  }}
                >
                  Address
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#1e2939',
                    lineHeight: 18,
                  }}
                >
                  {selectedAddress}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                backgroundColor: '#4f39f6',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                Confirm & Proceed
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 14,
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              Tap on the map or search for an address to select a location
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
