/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import { View, Text, FlatList, Switch, TouchableOpacity, StyleSheet, SafeAreaView, PermissionsAndroid, Platform, Alert, ActivityIndicator, TextInput, ScrollView, Dimensions, StatusBar, Animated, Appearance, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Easing } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { connectToDevice } from './src/services/BLEService';
import { connected } from 'process';
// Initialize BLE Manager with proper error handling
let manager: any = null;
try {
  manager = new BleManager();
  console.log('BLE Manager created successfully');

  // Initialize BLE Manager with error handling
  manager.onStateChange((state: any) => {
    console.log('BLE State:', state);
  }, true);
} catch (error) {
  console.error('BLE Manager initialization error:', error);
  // Create a fallback manager or show error
  // Alert.alert(
  //   'BLE Error',
  //   'Failed to initialize Bluetooth. Please ensure Bluetooth is enabled and try again.',
  //   [{ text: 'OK' }]
  // );
}
const BottomTab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();
const Stack = createStackNavigator();

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate screen diagonal for better device classification
const screenDiagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight) / 160; // 160 DPI is standard

// Comprehensive responsive design utilities
const isTinyDevice = screenWidth < 320; // iPhone SE, small Android
const isSmallDevice = screenWidth >= 320 && screenWidth < 375; // iPhone 12 mini, small Android
const isMediumDevice = screenWidth >= 375 && screenWidth < 414; // iPhone 12, most Android
const isLargeDevice = screenWidth >= 414 && screenWidth < 768; // iPhone 12 Pro Max, large Android
const isTablet = screenWidth >= 768; // iPad, Android tablets

// Enhanced responsive scaling functions

const scale = (size: number) => {
  if (isTinyDevice) return size * 0.7;
  if (isSmallDevice) return size * 0.8;
  if (isMediumDevice) return size * 0.9;
  if (isLargeDevice) return size * 1.0;
  if (isTablet) return size * 1.2;
  return size;
};

const scaleFont = (size: number) => {
  if (isTinyDevice) return size - 3;
  if (isSmallDevice) return size - 2;
  if (isMediumDevice) return size - 1;
  if (isLargeDevice) return size;
  if (isTablet) return size + 2;
  return size;
};

// Screen-specific spacing
const getSpacing = (baseSpacing: number) => {
  if (isTinyDevice) return baseSpacing * 0.6;
  if (isSmallDevice) return baseSpacing * 0.8;
  if (isMediumDevice) return baseSpacing * 0.9;
  if (isLargeDevice) return baseSpacing;
  if (isTablet) return baseSpacing * 1.3;
  return baseSpacing;
};

// Component-specific scaling
const getHeaderHeight = () => {
  if (isTinyDevice) return 50;
  if (isSmallDevice) return 55;
  if (isMediumDevice) return 60;
  if (isLargeDevice) return 65;
  if (isTablet) return 80;
  return 60;
};

const getCardPadding = () => {
  if (isTinyDevice) return 12;
  if (isSmallDevice) return 14;
  if (isMediumDevice) return 16;
  if (isLargeDevice) return 18;
  if (isTablet) return 24;
  return 16;
};

// Global date format state
let globalDateFormat = 'DD/MM/YYYY HH:mm:ss';

// Theme Types
export type ThemeType = 'light' | 'dark' | 'system';

// Theme Colors
export const lightTheme = {
  // Primary Colors
  primary: '#00bcd4',
  primaryDark: '#0097a7',
  primaryLight: '#e0f7fa',

  // Background Colors
  background: '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',

  // Text Colors
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',

  // Border & Divider Colors
  border: '#e0e0e0',
  divider: '#f0f0f0',

  // Overlay Colors
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(255,255,255,0.2)',

  // Shadow Colors
  shadow: '#000000',

  // Status Bar
  statusBar: 'light-content' as const,
  statusBarBg: '#00bcd4',

  // Theme Type
  isDark: false,
};

export const darkTheme = {
  // Primary Colors
  primary: '#00bcd4',
  primaryDark: '#0097a7',
  primaryLight: '#1a1a1a',

  // Background Colors
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',

  // Text Colors
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',

  // Border & Divider Colors
  border: '#404040',
  divider: '#2a2a2a',

  // Overlay Colors
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(255,255,255,0.1)',

  // Shadow Colors
  shadow: '#000000',

  // Status Bar
  statusBar: 'light-content' as const,
  statusBarBg: '#1e1e1e',

  // Theme Type
  isDark: true,
};

// Storage keys for persistent settings
const STORAGE_KEYS = {
  SENSOR_STATES: 'sensor_states',
  DATA_FREQUENCY: 'data_freequency',
  GPIO_ENABLED: 'gpio_enabled',
  SERVER_SITE_NAME: 'server_site_name',
  SELECTED_SIM: 'selected_sim',
  SELECTED_SENSOR: 'selected_sensor',
  SELECTED_DATE_FORMAT: 'selected_date_format',
  BLE_LOGS: 'ble_logs',
  LOG_SETTINGS: 'log_settings',
  THEME: 'theme',
  WIFI_SSID: 'wifi_ssid',
  WIFI_PASSWORD: 'wifi_password',
  WIFI_ENABLED_GSM_DISABLED: 'wifi_enabled_gsm_disabled',
  BACKWASH_FREQUENCY_MIN: 'backwash_frequency_min',
  PS_DELTA: 'ps_delta',
  PS_ENABLED_DDPS_DISABLED: 'ps_enabled_ddps_disabled',
  NUM_LEVEL_SENSOR: 'num_level_sensor',
  BACKWASH_TIME_SEC: 'backwash_time_sec',
};

// Default sensor states - will be dynamically populated from device data
const DEFAULT_SENSOR_STATES = {
  'pH': true,
  'TDS': true,
  'TempA': true,
  'TempW': true,
  'Flow Sensor': true,
  'Pressure Sensor': true,
  'Chlorine Sensor': true,
  'Weight Sensor': true,
  'Turbidity': true,
  'Switch 1': true,
  'Switch 2': true,
  'Ultrasonic Flow': true,
  'Ultrasonic Flow2UFM2': true
};



// Theme Context
interface ThemeContextType {
  theme: typeof lightTheme;
  themeType: ThemeType;
  isDark: boolean;
  setThemeType: (type: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeType, setThemeTypeState] = useState<ThemeType>('system');
  const [isDark, setIsDark] = useState(false);

  // Get current theme based on type and system preference
  const theme = useMemo(() => {
    if (themeType === 'system') {
      const systemColorScheme = Appearance.getColorScheme();
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeType === 'dark' ? darkTheme : lightTheme;
  }, [themeType]);

  // Update isDark state when theme changes
  useEffect(() => {
    setIsDark(theme === darkTheme);
  }, [theme]);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await loadFromStorage(STORAGE_KEYS.THEME, 'system');
        setThemeTypeState(savedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await saveToStorage(STORAGE_KEYS.THEME, themeType);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    saveTheme();
  }, [themeType]);

  const setThemeType = useCallback((type: ThemeType) => {
    setThemeTypeState(type);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeTypeState(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    themeType,
    isDark,
    setThemeType,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



// Storage utility functions using AsyncStorage for persistence
const saveToStorage = async (key: string, value: any) => {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    console.log('Saved to AsyncStorage:', key, typeof value === 'string' && value.length > 20 ? value.substring(0, 20) + '...' : value);
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

const loadFromStorage = async (key: string, defaultValue: any) => {
  try {
    const item = await AsyncStorage.getItem(key);
    if (item != null) {
      const parsed = JSON.parse(item);
      console.log('Loaded from AsyncStorage:', key, typeof parsed === 'string' && parsed.length > 20 ? parsed.substring(0, 20) + '...' : parsed);
      return parsed;
    }
    return defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
};

// Create a context for shared timer
const TimerContext = createContext({ currentTime: new Date() });

// Timer Provider Component
function TimerProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState(new Date());



  const value = useMemo(() => ({ currentTime }), [currentTime]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

// Hook to use shared timer
const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};

// Format date function (moved outside of hooks context)
const formatDate = (date: Date | number | string, format: string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'DD/MM/YYYY HH:mm:ss':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    case 'MM/DD/YYYY HH:mm:ss':
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'DD-MM-YYYY HH:mm:ss':
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    default:
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
};

// Memoized DeviceCard component
const DeviceCard = React.memo(({
  device,
  onConnect,
  onDisconnect,
  onPress,
  onDashboardPress
}: {
  device: any;
  onConnect: (device: any) => Promise<void>;
  onDisconnect: (device: any) => Promise<void>;
  onPress: (device: any) => void;
  onDashboardPress: (device: any) => void;
}) => {
  const [connecting, setConnecting] = useState(false);
  const { theme } = useTheme();

  // Calculate color and text for RSSI
  const rssiInfo = useMemo(() => {
    let rssiColor = theme.textSecondary;
    let rssiBg = theme.isDark ? '#2a2a2a' : '#f0f0f0';
    if (device.rssi >= -60) { rssiColor = theme.text; rssiBg = theme.success; }
    else if (device.rssi >= -80) { rssiColor = theme.text; rssiBg = '#8bc34a'; }
    else if (device.rssi < -80) { rssiColor = theme.text; rssiBg = '#9c27b0'; }
    return { rssiColor, rssiBg };
  }, [device.rssi, theme]);

  // Approximate distance (very rough, for demo)
  const distance = useMemo(() => {
    const dist = device.rssi ? Math.abs((27.55 - (20 * Math.log10(2400)) + Math.abs(device.rssi)) / 20.0) : 0;
    return dist.toFixed(2);
  }, [device.rssi]);

  // Use device's connectability status
  const isConnectable = device.isConnectable || false;
  const isConnected = device.isConnected || false;

  const handleConnectDisconnect = useCallback(async () => {
    if (!isConnectable || connecting) return;
    setConnecting(true);
    try {
      if (isConnected) {
        await onDisconnect(device);
      } else {
        await onConnect(device);
      }
    } catch (error) {
      console.error('Connection/Disconnection error:', error);
    } finally {
      setConnecting(false);
    }
  }, [isConnectable, connecting, isConnected, onConnect, onDisconnect, device]);

  return (
    <TouchableOpacity
      onPress={() => isConnected ? onDashboardPress(device) : null}
      activeOpacity={isConnected ? 0.7 : 1}
      style={{
        flex: 1,
        opacity: isConnected ? 1 : 0.8,
        transform: [{ scale: connecting ? 0.98 : 1 }],
      }}
    >
      <View style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        elevation: 2,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: isConnected ? theme.success : theme.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* RSSI Indicator */}
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: rssiInfo.rssiBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            elevation: 1,
          }}>
            <Text style={{ color: rssiInfo.rssiColor, fontWeight: 'bold', fontSize: 14 }}>
              {device.rssi || '--'}
            </Text>
            <Text style={{ color: rssiInfo.rssiColor, fontSize: 9, fontWeight: '500' }}>
              dBm
            </Text>
          </View>

          {/* Device Info */}
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: theme.text,
                flex: 1,
              }} numberOfLines={1}>
                {device.name || 'Unknown Device'}
              </Text>
              {isConnected && (
                <View style={{
                  backgroundColor: theme.success,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginLeft: 6,
                }}>
                  <Text style={{ fontSize: 9, color: theme.text, fontWeight: '600' }}>
                    CONNECTED
                  </Text>
                </View>
              )}
            </View>

            <Text style={{
              fontSize: 11,
              color: theme.textSecondary,
              marginBottom: 4,
              fontFamily: 'monospace',
            }} numberOfLines={1}>
              {device.id}
            </Text>

            {/* Distance */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="map-marker-distance" size={12} color={theme.textSecondary} />
              <Text style={{
                fontSize: 11,
                color: theme.textSecondary,
                marginLeft: 4
              }}>
                {distance} m
              </Text>
            </View>
          </View>

          {/* Connect Button */}
          <TouchableOpacity
            style={{
              backgroundColor: connecting ? theme.warning : (isConnected ? theme.error : (isConnectable ? theme.success : theme.border)),
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              elevation: 2,
              shadowColor: connecting ? theme.warning : (isConnected ? theme.error : (isConnectable ? theme.success : theme.border)),
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              minWidth: 80,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={!isConnectable || connecting}
            onPress={handleConnectDisconnect}
            activeOpacity={0.8}
          >
            {connecting ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Text style={{
                color: theme.text,
                fontWeight: 'bold',
                fontSize: 11,
                textAlign: 'center',
              }}>
                {isConnected ? 'DISCONNECT' : (isConnectable ? 'CONNECT' : 'N/A')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    ]);
    console.log('Permission results:', result);
    // Alert.alert('Permissions', JSON.stringify(result, null, 2));
  }
}

const ScannerScreen = ({ navigation }: { navigation: any }) => {
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState('');
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      manager.stopDeviceScan();
      console.log('✅ Stopped device scan on unmount');
    };
  }, []);

  const scanForDevices = async () => {
    if (scanning) {
      setLog('Scan already in progress');
      console.log('⚠️ Scan already in progress');
      return;
    }

    if (!manager) {
      setLog('BLE Manager not initialized');
      console.error('❌ BLE Manager not initialized');
      Alert.alert('Error', 'Bluetooth manager not initialized. Please restart the app.');
      return;
    }

    setScanning(true);
    setLog('Starting scan...');
    console.log('📡 Starting device scan');

    try {
      // Check BLE state
      const state = await manager.state();
      console.log('BLE State before scan:', state);
      if (state !== 'PoweredOn') {
        setLog(`Bluetooth is not available. State: ${state}`);
        console.warn(`⚠️ Bluetooth is not available. State: ${state}`);
        setScanning(false);
        Alert.alert('Error', `Bluetooth is not available. State: ${state}`);
        return;
      }

      // Start scan
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('❌ Scan error:', error);
          setLog(`Scan error: ${error.message}`);
          setScanning(false);
          return;
        }

        if (device && device.id) {
          console.log(`✅ Found device: ${device.name || device.id}`);
          setDevices(prev => {
            // Skip duplicates and already connected devices
            if (prev.some(d => d.id === device.id) || connectedDevices.some(d => d.id === device.id)) {
              return prev;
            }
            const newDevice = {
              ...device,
              isConnected: false,
              connectedDevice: null,
              isConnectable: device.name &&
                device.name !== 'N/A' &&
                device.name !== 'Unknown' &&
                device.name !== 'null' &&
                device.name.length > 0,
            };
            return [...prev, newDevice];
          });
        }
      });

      // Stop scan after 5 seconds
      setTimeout(() => {
        manager.stopDeviceScan();
        setScanning(false);
        setLog(`Scan completed. Found ${devices.length} new devices, ${connectedDevices.length} connected.`);
        console.log(`✅ Scan completed. Found ${devices.length} new devices, ${connectedDevices.length} connected.`);
      }, 5000);
    } catch (e: any) {
      console.error('❌ Scan start error:', e);
      setLog(`Failed to start scan: ${e.message || String(e)}`);
      setScanning(false);
    }
  };

  const connectToDevice = async (device: any) => {
    setLog(`Connecting to ${device.name || device.id}`);
    console.log(`🔗 Connecting to ${device.name || device.id}`);

    try {
      // Cancel any existing connection
      try {
        await manager.cancelDeviceConnection(device.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.warn('⚠️ Cancel connection error (ignored):', err);
      }

      // Connect with timeout
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
      console.log(`✅ Connected to ${device.name || device.id}`);

      setLog(`Connected to ${device.name || device.id}`);
      setConnectedDevices(prev => [
        ...prev.filter(d => d.id !== device.id),
        { ...device, isConnected: true, connectedDevice },
      ]);
      setDevices(prev => prev.filter(d => d.id !== device.id)); // Remove from scanned devices
      
      // Scroll to top to show the connected device
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      setLog(`Connection failed: ${error.message}`);
      setDevices(prev =>
        prev.map(d =>
          d.id === device.id ? { ...d, isConnected: false, connectedDevice: null } : d
        )
      );
    }
  };

  const disconnectFromDevice = async (device: any) => {
    setLog(`Disconnecting from ${device.name || device.id}`);
    console.log(`🔌 Disconnecting from ${device.name || device.id}`);

    try {
      await manager.cancelDeviceConnection(device.id);
      console.log(`✅ Disconnected from ${device.name || device.id}`);
      setLog(`Disconnected from ${device.name || device.id}`);
      setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
      setDevices(prev => [
        ...prev,
        { ...device, isConnected: false, connectedDevice: null },
      ]);
    } catch (error: any) {
      console.error('❌ Disconnection error:', error);
      setLog(`Disconnection failed: ${error.message}`);
    }
  };

  const handleDevicePress = (device: any) => {
    navigation.navigate('DeviceDetails', { device });
  };

  const handleDashboardPress = (device: any) => {
    if (device.isConnected) {
      navigation.navigate('DeviceDashboard', { device });
    } else {
      Alert.alert(
        'Device Not Connected',
        'Please connect to the device first to access the dashboard.',
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Connect Now',
            style: 'default',
            onPress: () => connectToDevice(device),
          },
        ]
      );
    }
  };

  // Combine connected and scanned devices for display
  const displayDevices = [...connectedDevices, ...devices];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        backgroundColor={theme.statusBarBg}
        barStyle={theme.statusBar}
        translucent
      />
      {/* Compact Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        paddingHorizontal: scale(16),
        paddingVertical: scale(8),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(8) : scale(8),
      }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('./src/assets/SWN_CHIEF_LOGO_FINAL.png')}
            style={{
              width: 80,
              height: 45,
              resizeMode: 'contain',
            }}
          />
          <Text style={{ color: theme.textSecondary, fontSize: scaleFont(12), marginTop: 4, textAlign: 'center' }}>
            Cyamsys Connect
          </Text>
        </View>
      </View>

      {/* Compact Scan Status */}
      {scanning && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 16,
          marginTop: 8,
          paddingVertical: 8,
          backgroundColor: theme.isDark ? '#2a2a2a' : '#f8f9fa',
          borderRadius: 8,
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.warning,
            marginRight: 8,
          }} />
          <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '500' }}>
            Scanning in progress...
          </Text>
        </View>
      )}

      {/* Device List */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
            Discovered Devices
          </Text>
          <View style={{
            backgroundColor: theme.primary,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
              {displayDevices.length} found
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef as any}
          data={displayDevices}
          keyExtractor={(item, index) => `${item.id || 'unknown'}-${index}`}
          renderItem={({ item }) => (
            <DeviceCard
              device={item}
              onConnect={connectToDevice}
              onDisconnect={disconnectFromDevice}
              onPress={handleDevicePress}
              onDashboardPress={handleDashboardPress}
            />
          )}
          ListEmptyComponent={
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 60,
              paddingHorizontal: 20,
            }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.isDark ? '#2a2a2a' : '#f0f0f0',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <Icon name="bluetooth-off" size={48} color={theme.textTertiary} />
              </View>
              <Text style={{
                fontSize: 20,
                color: theme.text,
                marginBottom: 8,
                textAlign: 'center',
                fontWeight: '600',
              }}>
                No devices found
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                Tap "Scan for Devices" to discover nearby BLE devices
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>

      {/* Log Display */}
      {log && (
        <View style={{
          backgroundColor: theme.isDark ? '#1a1a1a' : '#e3f2fd',
          marginHorizontal: 16,
          marginBottom: 8,
          padding: 12,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: theme.info,
          elevation: 1,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Icon name="information" size={14} color={theme.info} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: theme.info, fontWeight: '600' }}>
              Status
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{log}</Text>
        </View>
      )}

      {/* Scan Button at Bottom */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        elevation: 8,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: scanning ? theme.warning : theme.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: scanning ? 2 : 4,
            shadowColor: scanning ? theme.warning : theme.primary,
            shadowOffset: { width: 0, height: scanning ? 1 : 2 },
            shadowOpacity: scanning ? 0.3 : 0.4,
            shadowRadius: scanning ? 4 : 8,
            transform: [{ scale: scanning ? 0.98 : 1 }],
          }}
          onPress={scanForDevices}
          disabled={scanning}
          activeOpacity={0.8}
        >
          {scanning ? (
            <ActivityIndicator size="small" color={theme.text} style={{ marginRight: 12 }} />
          ) : (
            <Icon name="bluetooth" size={20} color={theme.text} style={{ marginRight: 12 }} />
          )}
          <Text style={{
            color: theme.text,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {scanning ? 'Scanning...' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function DeviceDashboardView({ route, navigation }: { route: any; navigation: any }) {
  let { device } = route.params;
  const { currentTime } = useTimer();
  const { theme } = useTheme();

  // Device Status State Variables
  const [isLoadingDeviceData, setIsLoadingDeviceData] = useState(true);
  // Device Status (live values)
  const [deviceStatusData, setDeviceStatusData] = useState({
    deviceDate: new Date().toLocaleDateString(),  // maps to "date"
    deviceTime: '',  // maps to "time"
    gsmSignalStrength: 0,                         // maps to "gsm_sig"
    gsmPostStatus: 'off',                         // maps to "gsm_post_status"
    batteryLevel: 0,                              // maps to "battery_lvl"
    solarLevel: 0,                                // maps to "solar_lvl"
    logCount: 0,                                  // maps to "log_count"
    deviceType: ''                                // maps to "D_type" (RMS or ACOM)
  });

  // Device Config (static configuration)
  const [deviceConfigData, setDeviceConfigData] = useState({
    IMEI_num: '',                 // maps to IMEI_num
    Servr_name: '',               // maps to Servr_name
    Fr_vr: '',                    // maps to Fr_vr
    data_freq: 0,                 // maps to data_freq
    date_fr: 'DD-MM-YYYY',        // maps to date_fr
    time_fr: 'HH:MM:SS',          // maps to time_fr
    lat: 0,                        // maps to lat
    lon: 0,                       // maps to lon
    gpio_extender_enabled: 0,  // maps to gpio_extender_enabled
    gsm_sim_name: '',              // maps to gsm_sim_name
    wifi_ssid: '',                 // maps to wifi_ssid
    wifi_enabled_gsm_disabled: 0,  // maps to wifi_enabled_gsm_disabled
    Backwash_frequency_min: '',    // maps to Backwash_frequency_min
    PS_delta: ''                   // maps to PS_delta
  });

  const [deviceServerSiteName, setDeviceServerSiteName] = useState('');
  const [logsIMEI, setLogsIMEI] = useState('');
  const [sensorConfigData, setSensorConfigData] = useState<any>({});

  const [rawSensorData, setRawSensorData] = useState<string>('');
  const [showSensorDataPopup, setShowSensorDataPopup] = useState(false);

  // Refresh Pop-up State
  const [showRefreshPopup, setShowRefreshPopup] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState('');

  // UI State
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const [serverSiteName, setServerSiteName] = useState('Site-001');
  const [gpio_enabled, set_gpio_enabled] = useState(0);
  const [dataFreequncy, setDataFreequency] = useState(0)
  // Drawer animation functions
  const openDrawer = () => {
    setShowSettingsDrawer(true);
    Animated.timing(drawerAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowSettingsDrawer(false);
    });
  };


  const [selectedSim, setSelectedSim] = useState('Jio');
  const [selectedSensor, setSelectedSensor] = useState('Chlorine level');
  const [selectedDateFormat, setSelectedDateFormat] = useState('DD/MM/YYYY HH:mm:ss');

  const subscriptionRef = useRef(null);

  const [sensorStates, setSensorStates] = useState(DEFAULT_SENSOR_STATES);

  async function startListening(deviceId: string, serviceUUID: string, characteristicUUID: string) {
    try {
      // Cancel any existing connection
      

      // Connect to device
      let connectedDevice;
      if(!device || !device.connectedDevice){
        console.log('⚠️ Device not connected, connecting now...');
        connectedDevice = await manager.connectToDevice(deviceId, { timeout: 15000 });
      console.log('✅ Connected to device:', deviceId);
      } else {
        connectedDevice = device.connectedDevice;
      }
      
      if (!connectedDevice) {
        throw new Error('Failed to get connected device');
      }  
      // Discover services and characteristics with retries
      let attempts = 3;
      while (attempts > 0) {
        try { 
          await connectedDevice.discoverAllServicesAndCharacteristics();
          const services = await connectedDevice.services();
          if (services.length === 0) {
            throw new Error('No services found after discovery');
          }
          console.log('✅ Services discovered:', services.map(s => s.uuid));
          break;
        } catch (discoveryError) {
          console.warn(`⚠️ Discovery attempt ${4 - attempts} failed:`, discoveryError);
          attempts--;
          if (attempts === 0) throw discoveryError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Verify service exists
      const services = await connectedDevice.services();
      let targetServiceUUID = serviceUUID.toLowerCase();
      const serviceExists = services.some(s => s.uuid.toLowerCase() === targetServiceUUID);
      if (!serviceExists) {
        throw new Error(`Service ${targetServiceUUID} not found`);
      }

      // Verify characteristic exists
      const characteristics = await connectedDevice.characteristicsForService(targetServiceUUID);
      const charExists = characteristics.some(c => c.uuid.toLowerCase() === characteristicUUID.toLowerCase());
      if (!charExists) {
        throw new Error(`Characteristic ${characteristicUUID} not found in service ${targetServiceUUID}`);
      }
      console.log('✅ Characteristic found:', characteristicUUID);

      // Monitor characteristic for notifications
      let responseBuffer = '';
      subscriptionRef.current = connectedDevice.monitorCharacteristicForService(
        targetServiceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Notification error:', error);
            if (error.message.includes('Device was disconnected') || error.message.includes('not found')) {
              // Handle disconnection gracefully
            }
            return;
          }

          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('📩 Received chunk:', chunk);
            responseBuffer += chunk;

            // Process complete messages
            while (responseBuffer.includes('{') && responseBuffer.includes('}')) {
              const start = responseBuffer.indexOf('{');
              const end = responseBuffer.indexOf('}') + 1;
              const completeMessage = responseBuffer.substring(start, end);

              if (completeMessage.startsWith('{S_Name')) {
                // Handle sensor data
                console.log('📡 Sensor data received:', completeMessage);
                const sensorData = parseSensorData(completeMessage);
                if (sensorData) {
                  setSensorConfigData(sensorData);
                  saveToStorage('sensor_config_data', parseSensorConfigForCalliberation(completeMessage));
                  console.log('✅ Saved sensor data:', sensorData);
                } else {
                  console.warn('❌ Failed to parse sensor data:', completeMessage);
                }
              } else if (completeMessage.startsWith('{$device_config$')) {
                // Handle device configuration
                console.log('⚙️ Device config received:', completeMessage);
                const configData = parseDeviceConfig(completeMessage);
                if (configData) {
                  setDeviceConfigData(prev => ({ ...prev, ...configData }));
                  // Also update device type if present in config (check multiple possible field names)
                  // Primary: "D_type" (from device)
                  const deviceType = configData.D_type || 
                                   configData.d_type || 
                                   configData.D_Type || 
                                   configData.D_TYPE || 
                                   configData.Device_type || 
                                   configData.device_type || 
                                   configData.deviceType || 
                                   configData.DeviceType || 
                                   configData.Device_Type || 
                                   configData.DEVICE_TYPE || 
                                   '';
                  if (deviceType) {
                    const normalizedDeviceType = deviceType.toUpperCase().trim();
                    setDeviceStatusData(prev => ({ 
                      ...prev, 
                      deviceType: normalizedDeviceType
                    }));
                    // Save device type to storage for Settings screen
                    saveToStorage('device_type', normalizedDeviceType);
                    console.log('📱 Device Type from config:', normalizedDeviceType);
                  }
                  saveToStorage('device_config', parseDeviceConfig(completeMessage));
                  console.log('✅ Updated device config:', configData);
                  console.log('🔍 All config keys:', Object.keys(configData));
                } else {
                  console.warn('❌ Failed to parse device config:', completeMessage);
                }
              } else if (completeMessage.startsWith('{$device_status$')) {
                // Handle device status
                console.log('📊 Device status received:', completeMessage);
                const statusData = parseDeviceStatus(completeMessage);
                if (statusData) {
                  // Extract device type (check multiple possible field names)
                  // Primary: "D_type" (from device)
                  const deviceType = statusData.D_type || 
                                   statusData.d_type || 
                                   statusData.D_Type || 
                                   statusData.D_TYPE || 
                                   statusData.Device_type || 
                                   statusData.device_type || 
                                   statusData.deviceType || 
                                   statusData.DeviceType || 
                                   statusData.Device_Type || 
                                   statusData.DEVICE_TYPE || 
                                   '';
                  
                  // Map time to deviceTime
                  const transformedStatusData = {
                    ...statusData,
                    ...(statusData.time ? { deviceTime: statusData.time } : {}),
                    ...(statusData.battery_lvl ? { batteryLevel: statusData.battery_lvl } : {}),
                    ...(() => {
                      // Check for various possible field names from device
                      const postStatusValue = statusData.gsm_post_status || 
                                             statusData.gsm_post || 
                                             statusData.post_status || 
                                             statusData.post || 
                                             statusData.data_post_status ||
                                             statusData.data_post;
                      
                      if (postStatusValue) {
                        const value = String(postStatusValue).toLowerCase().trim();
                        const normalized = (value === '1' || value === 'on' || value === 'ok' || 
                                          value === 'success' || value === 'active' || value === 'true') ? 'on' : 'off';
                        return { gsmPostStatus: normalized };
                      }
                      return {};
                    })(),
                    ...(statusData.gsm_sig ? { gsmSignalStrength: statusData.gsm_sig } : {}),
                    ...(statusData.solar_lvl ? { solarLevel: statusData.solar_lvl } : {}),
                    ...(deviceType ? { deviceType: deviceType.toUpperCase().trim() } : {}),
                  };
                  
                  if (deviceType) {
                    const normalizedDeviceType = deviceType.toUpperCase().trim();
                    // Save device type to storage for Settings screen
                    saveToStorage('device_type', normalizedDeviceType);
                    console.log('📱 Device Type detected from status (D_type):', normalizedDeviceType);
                  }
                  delete transformedStatusData.time; // Remove original time key if it exists
                  setDeviceStatusData(prev => ({ ...prev, ...transformedStatusData }));
                  saveToStorage('device_config', statusData);
                  console.log('✅ Updated device status:', transformedStatusData);
                  if (statusData.device_type) {
                    console.log('📱 Device Type detected:', statusData.device_type.toUpperCase());
                  }
                } else {
                  console.warn('❌ Failed to parse device status:', completeMessage);
                }
              } else {
                console.warn('⚠️ Ignoring unknown message:', completeMessage);
              }

              responseBuffer = responseBuffer.substring(end);
            }
          }
        }
      );
      console.log('✅ Subscribed to notifications for characteristic:', characteristicUUID);
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      throw error;
    }
  }




  // useEffect(()=>
  //   {
  //   const listen=async()=>{

  //   await startListening(device.id, SERVICE_UUID, F3_NOTIFY_UUID);
  //   }
  //   listen()
  // },[])


  useEffect(() => {
    // Fetch fresh data on component mount
    const fetchInitialData = async () => {
      // Check if device is available before proceeding
      if (!manager) {
        console.error('❌ BLE Manager is not available.');
        return;
      }
      
      if (!device?.id) {
        console.warn('⚠️ Device not available yet, skipping initial data fetch.');
        return;
      }

      try {
        await refreshAllDeviceData();  // <-- same function you use for manual refresh
        await startListening(device.id, SERVICE_UUID, F3_NOTIFY_UUID);
        console.log('✅ Listening started successfully.');
      } catch (error: any) {
        console.error('❌ Failed to start listening from useEffect:', error?.message || error);
        // Don't show alert for initial connection failures - device might not be connected yet
      }
    };

    fetchInitialData();
  }, [device?.id]); // Add device.id as dependency so it runs when device becomes available

  // Comprehensive refresh function with pop-up
  // Utility to wait
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Generic step runner withLogs retry support
  const runStep = async (
    label: string,
    progress: number,
    fn: () => Promise<any>,
    retry: boolean = true
  ) => {
    setRefreshStatus(label);
    setRefreshProgress(progress);

    try {
      await fn();
      console.log(`✅ ${label} completed`);
      return true;
    } catch (err) {
      console.log(`⚠️ ${label} failed:`, err);
      if (retry) {
        console.log(`🔄 Retrying ${label}...`);
        await sleep(1000);
        try {
          await fn();
          console.log(`✅ ${label} retry successful`);
          return true;
        } catch (err2) {
          console.log(`❌ ${label} retry failed:`, err2);
        }
      }
      return false;
    }
  };

  const refreshAllDeviceData = async (showPopup: boolean = true) => {
    if (!device) {
      console.log('❌ No device available for refresh');
      return;
    }

    console.log('=== STARTING COMPREHENSIVE DEVICE REFRESH ===');

    if (showPopup) {
      setShowRefreshPopup(true);
      setRefreshProgress(0);
      setRefreshStatus('Initializing connection...');
    }

    try {
      // Ensure device is connected (retry once if needed)
      const ensureConnected = async () => {
        try {
          const isConnected = await device.isConnected;
          if (!isConnected) {
            console.log('🔌 Device disconnected, connecting...');
            await device.connect();

          }
        } catch (err) {
          console.log('⚠️ Error while connecting, retrying once...', err);
          await device.connect;
          await sleep(2000);
        }
      };

      await ensureConnected();

      // Sequential fetches (with connection check before each critical step)
      await runStep('Fetching device status...', 25, async () => {
        await ensureConnected();
        return fetchDeviceStatus();
      });

      await runStep('Fetching device configuration...', 50, async () => {
        await ensureConnected();
        return fetchDeviceConfig();
      });

      await runStep('Fetching sensor data...', 75, async () => {
        await ensureConnected();
        console.log("_______________________________________________--------------------------__________________", device)
        return fetchSensorData();
      });



      // Final validation
      setRefreshStatus('Validating data...');

      // Success
      setRefreshStatus('Refresh completed successfully!');

      if (showPopup) {
        setTimeout(() => {
          setShowRefreshPopup(false);
          setRefreshProgress(0);
          setRefreshStatus('');
        }, 2000);
      }
      await startListening(device.id, SERVICE_UUID, F3_NOTIFY_UUID)
      console.log('=== DEVICE REFRESH COMPLETED SUCCESSFULLY ===');
    } catch (error: any) {
      console.error('❌ Error during device refresh:', error);
      setRefreshStatus(`Error: ${error.message}`);

      if (showPopup) {
        setTimeout(() => {
          setShowRefreshPopup(false);
          setRefreshProgress(0);
          setRefreshStatus('');
        }, 3000);
      }
    }
  };



  // Single auto-fetch state
  const [autoFetchCompleted, setAutoFetchCompleted] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Fetch device data (status, config, sensors) on component mount - ONLY ONCE
  // useEffect(() => {
  //   const fetchDeviceData = async () => {
  //     if (device && !autoFetchCompleted) {
  //       console.log('=== DEVICE CONNECTED - STARTING SINGLE AUTO FETCH ===');
  //       setLastFetchTime(new Date());
  //       // Use the comprehensive refresh function instead
  //       await refreshAllDeviceData(false); // Don't show popup for auto-fetch
  //       setAutoFetchCompleted(true);
  //       console.log('✅ Initial auto-fetch completed');
  //     }
  //   };

  //   fetchDeviceData();
  // }, [device, autoFetchCompleted]);

  // Removed connection monitoring to prevent conflicts

  // Device Status Fetching Functions
  const DEVICE_STATUS_COMMAND = '{$send_device_status}';
  const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
  const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
  const F3_NOTIFY_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

  // Parse device status data from F3 response
  const parseDeviceStatus = (data: string) => {
    try {
      console.log('Raw device status data received:', data);

      // Remove { } wrapper and split by comma
      let cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
      cleanData = cleanData.replace(/^\$?device_status\$/i, '').trim();
      console.log('Cleaned data:', cleanData);

      const pairs = cleanData.split(',');
      const statusData: any = {};

      pairs.forEach(pair => {
        const [key, value] = pair.split(':');
        if (key && value !== undefined) {
          const cleanKey = key.trim();
          const cleanValue = value.trim();
          statusData[cleanKey] = cleanValue;
          console.log(`Parsed: ${cleanKey} = ${cleanValue}`);
        }
      });

      console.log('Final parsed status data:', statusData);
      return statusData;
    } catch (error) {
      console.log('Error parsing device status:', error);
      return null;
    }
  };

  // Send command in chunks (18 bytes per chunk as per Arduino code)
  const sendCommandInChunks = async (device: any, command: string, chunkSize: number = 18) => {
    try {
      const encoded = Buffer.from(command, 'utf8');
      console.log(`Sending command "${command}" in chunks of ${chunkSize} bytes`);

      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        const base64Chunk = chunk.toString('base64');

        console.log(`Sending chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.toString('utf8')}`);

        await device.writeCharacteristicWithoutResponseForService(
          SERVICE_UUID,
          F1_WRITE_UUID,
          base64Chunk
        );

        // Small delay between chunks
        // await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('Command sent successfully in chunks');
      return true;
    } catch (error) {
      console.log('Error sending command in chunks:', error);
      return false;
    }
  };

  // Monitor F3 for device status response
  const monitorF3ForDeviceStatus = async (device: any) => {
    return new Promise((resolve, reject) => {
      let responseData = '';
      let timeoutId: NodeJS.Timeout;

      // const timeout = setTimeout(() => {
      //   console.log('Device status response timeout');
      //   reject(new Error('Device status response timeout'));
      // }, 10000); // 10 second timeout

      device.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log('F3 monitoring error:', error);
            // clearTimeout(timeout);
            reject(error);
            return;
          }

          if (characteristic && characteristic.value) {
            const newValue = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received F3 data:', newValue);

            responseData += newValue;

            // Check if we have a complete message (wrapped in {})
            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete device status message:', completeMessage);
              // clearTimeout(timeout);
              resolve(completeMessage);
            }
          }
        }
      );
    });
  };

  // Main function to fetch device status
  const  fetchDeviceStatus = async () => {
    if (!device) {
      console.log('❌ No device available');
      return;
    }

    setIsLoadingDeviceData(true);
    console.log('🚀 Starting device status fetch...');

    try {
      // Cancel old connection
      try {
        await manager.cancelDeviceConnection(device.id);
        // await new Promise(res => setTimeout(res, 500));
      } catch {
        // ignore cancel errors
      }

      // Connect
      console.log('🔌 Connecting to device...');
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Device connected & services discovered', connectedDevice.discoverAllServicesAndCharacteristics());
      console.log('✅ Device connected & services discovered');

      // Commands to try
      const commands = ['{$send_device_status}', 'send_device_status', 'device_status', 'status'];
      let response: string | null = null;

      for (const cmd of commands) {
        try {
          console.log(`➡️ Sending command: ${cmd}`);
          const sent = await sendCommandInChunks(connectedDevice, cmd);
          if (!sent) continue;

          response = await monitorF3ForDeviceStatus(connectedDevice);
          if (response) {
            console.log(`✅ Got response for: ${cmd}`);
            break;
          }
        } catch (err: any) {
          console.log(`⚠️ Command ${cmd} failed: ${err.message}`);
        }
      }

      if (!response) {
        console.log('❌ No response from device status command');
        return;
      }

      console.log('📥 Raw response:', response);
      const statusData = parseDeviceStatus(response);

      if (!statusData) {
        console.log('❌ Could not parse device status data');
        return;
      }

      // === Mapping fields ===
      const batteryLevel = parseFloat(
        statusData.battery_lvl || statusData.battery || '0'
      ) || 0;

      const gsmSignalStrength = parseFloat(
        statusData.gsm_sig || statusData.gsm_signal_strength || '0'
      ) || 0;

      // Normalize gsm_post_status - handle multiple possible field names and success values
      // Check for various possible field names from device
      const postStatusValue = statusData.gsm_post_status || 
                             statusData.gsm_post || 
                             statusData.post_status || 
                             statusData.post || 
                             statusData.data_post_status ||
                             statusData.data_post ||
                             'off';
      
      let gsmPostStatus = 'off';
      if (postStatusValue && postStatusValue !== 'off') {
        const normalized = String(postStatusValue).toLowerCase().trim();
        // Check for various success indicators
        if (normalized === '1' || normalized === 'on' || normalized === 'ok' || 
            normalized === 'success' || normalized === 'active' || normalized === 'true') {
          gsmPostStatus = 'on';
        } else {
          gsmPostStatus = 'off';
        }
      }

      const deviceDate =
        statusData.date ||
        statusData.device_date ||
        new Date().toLocaleDateString();

      let deviceTime =
        statusData.time ||
        statusData.device_time ||
        new Date().toLocaleTimeString();

      // Normalize time if numeric only
      if (deviceTime) {

        deviceTime = `${deviceTime}`;
      }

      const solarLevel = parseFloat(statusData.solar_lvl || '0') || 0;
      const logCount = parseInt(statusData.log_count || '0') || 0;

      // From config if not in status
      const latitude =
        deviceConfigData.lat;
      const longitude =
        deviceConfigData.lon;

      // Extract device type (RMS or ACOM) - check multiple possible field names
      // Primary: "D_type" (from device)
      const deviceType = statusData.D_type || 
                        statusData.d_type || 
                        statusData.D_Type || 
                        statusData.D_TYPE || 
                        statusData.Device_type || 
                        statusData.device_type || 
                        statusData.deviceType || 
                        statusData.DeviceType || 
                        statusData.Device_Type || 
                        statusData.DEVICE_TYPE || 
                        deviceStatusData.deviceType || 
                        '';

      const newStatusData = {
        batteryLevel,
        gsmSignal: gsmSignalStrength > 0 ? 'active' : 'inactive',
        gsmSignalStrength,
        gsmPostStatus,
        deviceDate,
        deviceTime,
        solarLevel,
        logCount,
        latitude,
        longitude,
        deviceType
      };

      console.log('✅ Parsed Device Status:', newStatusData);
      await saveToStorage('time', deviceTime);
      setDeviceStatusData(newStatusData);
    } catch (err: any) {
      console.log('❌ Error fetching device status:', err.message);
    } finally {
      setIsLoadingDeviceData(false);
    }
  };


  // Function to fetch device configuration data
  const fetchDeviceConfig = async () => {
    if (!device) {
      console.log("No device available for config fetch");
      return;
    }

    console.log("=== STARTING DEVICE CONFIG FETCH ===");

    try {
      // 🔹 Always ensure a fresh connection
      console.log("Getting fresh connection for config fetch...");
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
      console.log("✅ Device connected successfully for config fetch");

      // 🔹 Verify connection is stable
      if (!connectedDevice || !connectedDevice.isConnected) {
        throw new Error("Device connection failed");
      }

      // 🔹 Discover services + characteristics
      console.log("Discovering services and characteristics...");
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("✅ Services discovered successfully for config fetch");

      // 🔹 Commands to try (kept minimal, avoid duplicate entries)
      const commandsToTry = [
        "{$send_device_config}",
      ];

      let response: string | null = null;
      let successfulCommand: string | null = null;

      for (const command of commandsToTry) {
        try {
          console.log(`➡️ Sending config command: "${command}"`);

          // Step 1: Send command
          const sentOk = await sendCommandInChunks(connectedDevice, command);
          if (!sentOk) {
            console.log(`❌ Failed to send command: "${command}"`);
            continue;
          }

          // Step 2: Wait for response from F3
          console.log(`⏳ Waiting for response from F3 for "${command}"...`);
          response = await monitorF3ForDeviceConfig(connectedDevice);

          if (response) {
            console.log(`✅ Response received for "${command}"`);
            successfulCommand = command;
            break; // stop after first success
          }
        } catch (err: any) {
          console.log(`⚠️ Command "${command}" failed: ${err.message}`);
        }
      }

      if (!response) {
        console.log("❌ No config response received from any command");
        return;
      }

      console.log(`🎯 Successful command: "${successfulCommand}"`);
      console.log("📦 Raw config response:", response);

      // Step 3: Parse and update config
      const configData = parseDeviceConfig(response);
      if (configData) {
        console.log("✅ Parsed config:", configData);
        setDeviceConfigData(configData); // store in state
      } else {
        console.log("❌ Failed to parse config response");
      }
    } catch (err: any) {
      console.log("❌ Error during config fetch:", err.message || err);
    }

    console.log("=== DEVICE CONFIG FETCH COMPLETED ===");
  };


  // Function to monitor F3 for device config response
  const monitorF3ForDeviceConfig = async (connectedDevice): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      let responseBuffer = '';
      let timeoutHandle: any;

      try {
        console.log('Subscribing to F3 for device config...');

        const subscription = connectedDevice.monitorCharacteristicForService(
          SERVICE_UUID,
          F3_NOTIFY_UUID,
          (error, characteristic) => {
            if (error) {
              console.log('Error monitoring F3:', error);
              clearTimeout(timeoutHandle);
              subscription.remove();
              reject(error);
              return;
            }

            if (characteristic?.value) {
              const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
              console.log('Received config chunk:', chunk);

              responseBuffer += chunk;

              // ✅ Stop condition: JSON end marker
              if (responseBuffer.trim().endsWith('}')) {
                clearTimeout(timeoutHandle);
                subscription.remove();
                resolve(responseBuffer);
              }
            }
          }
        );

        // Fallback timeout
        // timeoutHandle = setTimeout(() => {
        //   console.log('Config fetch timed out, returning partial data:', responseBuffer);
        //   subscription.remove();
        //   resolve(responseBuffer || null);
        // }, 8000);

      } catch (err) {
        console.log('Error in monitorF3ForDeviceConfig:', err);
        reject(err);
      }
    });
  };




  // Function to parse device configuration data
  const parseDeviceConfig = (data: string) => {
    try {
      console.log('Parsing device config data:', data);

      // ✅ Step 1: Remove outer braces
      let cleanData = data.replace(/^[{}]+|[{}]+$/g, '');

      // ✅ Step 2: Remove the $device_config$ prefix if it exists
      cleanData = cleanData.replace(/^\$?device_config\$/i, '').trim();
      console.log('Cleaned config data:', cleanData);

      // ✅ Step 3: Split by comma
      const pairs = cleanData.split(',');
      const configData: any = {};

      pairs.forEach(pair => {
        const [key, value] = pair.split(':');
        if (key && value !== undefined) {
          const cleanKey = key.trim();
          const cleanValue = value.trim();
          configData[cleanKey] = cleanValue;
          console.log(`Config parsed: ${cleanKey} = ${cleanValue}`);
        }
      });

      console.log('Final parsed config data:', configData);

      // ✅ Extract and update all configuration values
      const serverSiteName =
        configData.Servr_name ||
        configData.Server ||
        configData.server ||
        configData.Server_site ||
        configData.server_site ||
        '';
      if (serverSiteName) {
        setDeviceServerSiteName(serverSiteName);
        console.log('Device server site name extracted:', serverSiteName);

        if (setServerSiteName) {
          setServerSiteName(serverSiteName);
          console.log('Updated parent component with fresh server site name from config:', serverSiteName);
        }

        saveToStorage(STORAGE_KEYS.SERVER_SITE_NAME, serverSiteName);
        console.log('Updated local storage with fresh server site name from config:', serverSiteName);
      }

      const simName =
        configData.gsm_sim_name ||
        configData.gsm_sim ||
        configData.sim_name ||
        '';
      if (simName) {
        console.log('Device SIM name extracted:', simName);
        setSelectedSim(simName);
        console.log('Updated dashboard selectedSim with fresh device data:', simName);
        saveToStorage(STORAGE_KEYS.SELECTED_SIM, simName);
        console.log('Updated local storage with fresh SIM name from config:', simName);
      }

      const dataFreq = configData.data_freq || configData.data_frequency || '';
      if (dataFreq) {
        setDataFreequency(dataFreq / 60)
        saveToStorage(STORAGE_KEYS.DATA_FREQUENCY, dataFreequncy)
        console.log('Device data frequency extracted:', dataFreq);
      }

      const dateFormat = configData.date_fr || configData.date_format || '';
      if (dateFormat) {
        console.log('Device date format extracted:', dateFormat);
        setSelectedDateFormat(dateFormat);
        console.log('Updated dashboard selectedDateFormat with fresh device data:', dateFormat);
        saveToStorage(STORAGE_KEYS.SELECTED_DATE_FORMAT, dateFormat);
        console.log('Updated local storage with fresh date format from config:', dateFormat);
      }

      const timeFormat = configData.time_fr || configData.time_format || '';
      if (timeFormat) {
        console.log('Device time format extracted:', timeFormat);
      }

      const gpioEnabled = configData.gpio_extender_enabled || '0';
      if (gpioEnabled) {
        saveToStorage(STORAGE_KEYS.GPIO_ENABLED, gpioEnabled)
        set_gpio_enabled(gpioEnabled)
        console.log('Device GPIO extender status extracted:', gpioEnabled);
      }

      // Extract WiFi SSID, Backwash Frequency Min, and PS Delta from device config
      // Check multiple possible key variations (device might send in different cases)
      const wifiSSID = configData.wifi_ssid || configData.Wifi_ssid || configData.WIFI_SSID || 
                      configData['wifi_ssid'] || '';
      if (wifiSSID) {
        console.log('Device WiFi SSID extracted:', wifiSSID);
        saveToStorage(STORAGE_KEYS.WIFI_SSID, wifiSSID);
      }

      const backwashFreq = configData.Backwash_frequency_min || configData.backwash_frequency_min || 
                          configData.BACKWASH_FREQUENCY_MIN || configData['Backwash_frequency_min'] || '';
      if (backwashFreq) {
        console.log('Device Backwash Frequency Min extracted:', backwashFreq);
        saveToStorage(STORAGE_KEYS.BACKWASH_FREQUENCY_MIN, backwashFreq);
      }

      const psDelta = configData.PS_delta || configData.ps_delta || configData.PS_DELTA || 
                     configData['PS_delta'] || '';
      if (psDelta) {
        console.log('Device PS Delta extracted:', psDelta);
        saveToStorage(STORAGE_KEYS.PS_DELTA, psDelta);
      }

      // Extract wifi_enabled_gsm_disabled from device config
      const wifiEnabledGsmDisabled = configData.wifi_enabled_gsm_disabled || 
                                    configData.Wifi_enabled_gsm_disabled || 
                                    configData.WIFI_ENABLED_GSM_DISABLED || 
                                    configData['wifi_enabled_gsm_disabled'] || 
                                    '0';
      if (wifiEnabledGsmDisabled !== undefined && wifiEnabledGsmDisabled !== '') {
        const wifiEnabledValue = parseInt(wifiEnabledGsmDisabled.toString(), 10) || 0;
        console.log('Device WiFi Enabled GSM Disabled extracted:', wifiEnabledValue);
        saveToStorage(STORAGE_KEYS.WIFI_ENABLED_GSM_DISABLED, wifiEnabledValue);
        // Update deviceConfigData
        setDeviceConfigData(prev => ({
          ...prev,
          wifi_enabled_gsm_disabled: wifiEnabledValue
        }));
      }

      return configData;
    } catch (error) {
      console.log('Error parsing device config:', error);
      return null;
    }
  };


  // Function to fetch sensor data (current readings)
  let isFetchingSensor = false; // 🚦 Prevent parallel fetches
  const utf8ToBase64 = (str: string): string => {
    return Buffer.from(str, "utf8").toString("base64");
  };

  // Convert Base64 → UTF-8 string
  const base64ToUtf8 = (b64: string): string => {
    return Buffer.from(b64, "base64").toString("utf8");
  };

  const fetchSensorData = async () => {
    if (!device) {
      console.log('❌ No device available');
      return;
    }

    if (isFetchingSensor) return;
    isFetchingSensor = true;

    console.log('🚀 Starting sensor data fetch...');

    try {
      // Cancel old connection
      try {
        await manager.cancelDeviceConnection(device.id);
        // await new Promise(res => setTimeout(res, 500));
      } catch {
        // ignore cancel errors
      }

      // Connect
      console.log('🔌 Connecting to device...');
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 1500 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Device connected & services discovered');

      // Commands to try
      const commands = ['{$send_sensor_data}'];
      let response: string | null = null;
      let successfulCommand: string | null = null;

      for (const cmd of commands) {
        try {
          console.log(`➡️ Sending command: ${cmd}`);
          await sendCommandInChunks(connectedDevice, cmd);

          response = await monitorF3ForSensorConfig(connectedDevice);
          if (response) {
            console.log(`✅ Got response for: ${cmd}`);
            successfulCommand = cmd;
            const sensorData = parseSensorData(response);
            if (sensorData) {
              console.log("✅ Parsed sensordata:", sensorData);
              setSensorConfigData(sensorData); // store in state
              await saveToStorage('sensor_config_data', parseSensorConfigForCalliberation(response))
            } else {
              console.log("❌ Failed to parse config response");
            }
            break;
          }
        } catch (err: any) {
          console.log(`⚠️ Command ${cmd} failed: ${err.message}`);
        }
      }

      if (!response) {
        console.log('❌ No sensor data response received from device');
        return;
      }

      console.log(`📦 Raw sensor config response for "${successfulCommand}":`, response);
      return response;

    } catch (err: any) {
      console.log('❌ Error fetching sensor config:', err.message);
      throw err;
    } finally {
      isFetchingSensor = false;
    }
  };


  const parseSensorConfigForCalliberation = (data: string) => {
    try {
      console.log('Parsing sensor config data:', data);

      // Remove { } wrapper
      const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
      console.log('Cleaned sensor config data:', cleanData);

      const sensorData: {
        [key: string]: {
          offset: number;
          scale: number;
          is_en: number;
          val: number;
          rs485: boolean;
          response: string;
          sensorName: string;
        };
      } = {};
      const keyNames: string[] = []; // Array to store just the Key values

      // Use while loop to find all S_Name:%s patterns
      let currentData = cleanData;
      let startIndex = 0;

      while (true) {
        // Find next S_Name: occurrence
        const sNameIndex = currentData.indexOf('S_Name:', startIndex);
        if (sNameIndex === -1) break; // No more S_Name: found

        // Find the end of this sensor entry (next S_Name: or end of string)
        const nextSNameIndex = currentData.indexOf('S_Name:', sNameIndex + 7);
        const endIndex = nextSNameIndex !== -1 ? nextSNameIndex : currentData.length;

        // Extract this sensor entry
        const sensorEntry = currentData.substring(sNameIndex + 7, endIndex);
        console.log('Processing sensor entry:', sensorEntry);

        try {
          // Parse the sensor name (everything before first comma)
          const commaIndex = sensorEntry.indexOf(',');
          if (commaIndex === -1) {
            console.log('Skipping sensor entry with no comma');
            startIndex = sNameIndex + 7;
            continue;
          }

          const sensorName = sensorEntry.substring(0, commaIndex).trim();
          console.log('Found sensor name:', sensorName);

          // Skip entries with empty S_Name
          if (!sensorName) {
            console.log('Skipping sensor entry with empty S_Name');
            startIndex = sNameIndex + 7;
            continue;
          }

          // Parse the key (Key:<value>)
          const keyMatch = sensorEntry?.match(/Key:([^,}]+)/);
          const key = keyMatch ? keyMatch[1].trim() : '';

          // Skip entries with empty Key
          if (!key) {
            console.log('Skipping sensor entry with empty Key');
            startIndex = sNameIndex + 7;
            continue;
          }

          // Handle duplicate keys
          const existingCount = keyNames.filter(name => name === key).length;
          const uniqueSensorKey = existingCount > 0 ? `${key}_${existingCount + 1}` : key;
          keyNames.push(uniqueSensorKey);

          // Extract other fields
          const offsetMatch = sensorEntry?.match(/Offset:([^,}]+)/);
          const scaleMatch = sensorEntry?.match(/Scale:([^,}]+)/);
          const isEnMatch = sensorEntry?.match(/is_en:([^,}]+)/);
          const valMatch = sensorEntry?.match(/Val:([^,}]+)/);
          const rs485Match = sensorEntry?.match(/RS485:([^,}]+)/);
          const responseMatch = sensorEntry?.match(/Response:([^,}]+)/);

          sensorData[uniqueSensorKey] = {
            offset: offsetMatch ? parseFloat(offsetMatch[1]) : 0,
            scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
            is_en: isEnMatch ? parseFloat(isEnMatch[1]) : 0,
            val: valMatch ? parseFloat(valMatch[1]) : 0,
            rs485: rs485Match ? rs485Match[1].toLowerCase() === 'yes' : false,
            response: responseMatch ? responseMatch[1] : 'Unknown',
            sensorName, // Preserve S_Name for reference
          };

          console.log(
            `Parsed sensor: ${uniqueSensorKey}, Offset: ${sensorData[uniqueSensorKey].offset
            }, Scale: ${sensorData[uniqueSensorKey].scale}, Active: ${sensorData[uniqueSensorKey].is_en
            }, Val: ${sensorData[uniqueSensorKey].val}, RS485: ${sensorData[uniqueSensorKey].rs485
            }, Response: ${sensorData[uniqueSensorKey].response}, SensorName: ${sensorData[uniqueSensorKey].sensorName
            }`
          );
        } catch (sensorError) {
          console.log('Error parsing individual sensor:', sensorError);
        }

        // Move to next position
        startIndex = sNameIndex + 7;
      }

      console.log('Final parsed sensor config:', sensorData);
      return sensorData;
    } catch (error) {
      console.log('Error parsing sensor config:', error);
      return {};
    }
  };

  // const parseSensorConfigForCalliberation = (data: string) => {
  //     try {
  //       console.log('Parsing sensor config data:', data);

  //       // Remove { } wrapper
  //       const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
  //       console.log('Cleaned sensor config data:', cleanData);

  //       const sensorData: any = {};
  //       const sensorNames: string[] = []; // Array to store just the sensor names

  //       // Use while loop to find all S_Name:%s patterns
  //       let currentData = cleanData;
  //       let startIndex = 0;

  //       while (true) {
  //         // Find next S_Name: occurrence
  //         const sNameIndex = currentData.indexOf('S_Name:', startIndex);
  //         if (sNameIndex === -1) break; // No more S_Name: found

  //         // Find the end of this sensor entry (next S_Name: or end of string)
  //         const nextSNameIndex = currentData.indexOf('S_Name:', sNameIndex + 7);
  //         const endIndex = nextSNameIndex !== -1 ? nextSNameIndex : currentData.length;

  //         // Extract this sensor entry
  //         const sensorEntry = currentData.substring(sNameIndex + 7, endIndex);
  //         console.log('Processing sensor entry:', sensorEntry);

  //         try {
  //           // Parse the sensor name (everything before first comma)
  //           const commaIndex = sensorEntry.indexOf(',');
  //           if (commaIndex !== -1) {
  //             const sensorName = sensorEntry.substring(0, commaIndex).trim();
  //             console.log('Found sensor name:', sensorName);

  //             if (sensorName) {
  //               // Count how many times this sensor name appears to handle duplicates
  //               const existingCount = sensorNames.filter(name => name === sensorName).length;
  //               const uniqueSensorKey = existingCount > 0 ? `${sensorName}_${existingCount + 1}` : sensorName;

  //               sensorNames.push(uniqueSensorKey);

  //               // Try to extract offset and scale
  //               const offsetMatch = sensorEntry.match(/Offset:([^,}]+)/);
  //               const scaleMatch = sensorEntry.match(/Scale:([^,}]+)/);
  //               const is_enMatch=sensorEntry.match(/is_en:([^,}]+)/)
  //               if (offsetMatch && scaleMatch) {
  //                 const offset = parseFloat(offsetMatch[1]);
  //                 const scale = parseFloat(scaleMatch[1]);
  //                 const isEnabled=parseFloat(is_enMatch[1]);
  //                 sensorData[uniqueSensorKey] = {
  //                   name: uniqueSensorKey,
  //                   offset: offset,
  //                   scale: scale,
  //                   is_en:isEnabled
  //                 };

  //                 console.log(`Parsed sensor: ${uniqueSensorKey}, Offset: ${offset}, Scale: ${scale}`);
  //               } else {
  //                 // If no offset/scale, just store the name
  //                 sensorData[uniqueSensorKey] = {
  //                   name: uniqueSensorKey,
  //                   offset: 0,
  //                   scale: 1
  //                 };
  //               }
  //             }
  //           }
  //         } catch (sensorError) {
  //           console.log('Error parsing individual sensor:', sensorError);
  //         }

  //         // Move to next position
  //         startIndex = sNameIndex + 7;
  //       }

  //       // Update the sensor states with actual sensor names from device


  //       console.log('Final parsed sensor config:', sensorData);
  //       return sensorData;
  //     } catch (error) {
  //       console.log('Error parsing sensor config:', error);
  //       return null;
  //     }
  //   };

  // Function to monitor F3 for sensor config response
  const monitorF3ForSensorConfig = (connectedDevice: Device): Promise<string> => {
    return new Promise((resolve, reject) => {
      let responseData = '';
      const timeoutId = setTimeout(() => {
        console.log('Sensor config response timeout');
        reject(new Error('Sensor config response timeout'));
      }, 10000);

      const subscription = connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('F3 monitoring error (sensor config):', error);
            clearTimeout(timeoutId);
            subscription.remove();
            reject(error);
            return;
          }

          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received F3 data (sensor config):', chunk);
            responseData += chunk;

            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete sensor config message:', completeMessage);
              clearTimeout(timeoutId);
              subscription.remove();
              resolve(completeMessage);
            }
          }
        }
      );
    });
  };




  // Function to parse sensor configuration data
  const parseSensorData = (rawResponse: string) => {
    try {
      // 1. Strip outer braces and trailing commas
      let clean = rawResponse.trim().replace(/^{|}$/g, "").replace(/,+$/, "");

      // 2. Split by commas, then into key:value pairs
      const tokens = clean.split(/,(?=S_Name:|Key:|Val:|is_en:|Offset:|Scale:|RS485:|Response:)/);

      const sensors: any[] = [];
      let current: any = {};

      tokens.forEach(token => {
        const [key, value] = token.split(":");

        if (key === "S_Name" && Object.keys(current).length > 0) {
          // start of new sensor → push previous
          sensors.push(current);
          current = {};
        }

        current[key.trim()] = value?.trim() || "";
      });

      // push last one
      if (Object.keys(current).length > 0) {
        sensors.push(current);
      }

      return sensors;
    } catch (err) {
      console.error("❌ Failed to parse sensor data:", err);
      return [];
    }
  };


  // Function to extract IMEI from logs data
  const extractIMEIFromLogs = (logsData: string) => {
    try {
      console.log('Extracting IMEI from data:', logsData);

      // Try multiple IMEI patterns
      const patterns = [
        /IMEI:([^,}]+)/,           // IMEI:123456789
        /"IMEI":"([^"]+)"/,        // "IMEI":"123456789"
        /'IMEI':'([^']+)'/,        // 'IMEI':'123456789'
        /IMEI_num:([^,}]+)/,       // IMEI_num:123456789
        /imei:([^,}]+)/,           // imei:123456789
        /"imei":"([^"]+)"/,        // "imei":"123456789"
        /'imei':'([^']+)'/,        // 'imei':'123456789'
        /imei_num:([^,}]+)/,       // imei_num:123456789
        /"imei_num":"([^"]+)"/,    // "imei_num":"123456789"
        /'imei_num':'([^']+)'/,    // 'imei_num':'123456789'
        /IMEI_number:([^,}]+)/,    // IMEI_number:123456789
        /"IMEI_number":"([^"]+)"/, // "IMEI_number":"123456789"
        /'IMEI_number':'([^']+)'/, // 'IMEI_number':'123456789'
        /imei_number:([^,}]+)/,    // imei_number:123456789
        /"imei_number":"([^"]+)"/, // "imei_number":"123456789"
        /'imei_number':'([^']+)'/, // 'imei_number':'123456789'
      ];

      for (const pattern of patterns) {
        const match = logsData?.match(pattern);
        if (match && match[1]) {
          const extracted = match[1].trim();
          console.log(`IMEI found with pattern ${pattern}:`, extracted);
          return extracted;
        }
      }

      // If no pattern matches, try to find any 15-digit number (typical IMEI length)
      const digitMatch = logsData?.match(/\b\d{15}\b/);
      if (digitMatch) {
        console.log('IMEI found as 15-digit number:', digitMatch[0]);
        return digitMatch[0];
      }

      console.log('No IMEI pattern found in data');
      return '';
    } catch (error) {
      console.log('Error extracting IMEI from logs:', error);
      return '';
    }
  };

  // Function to test device connection - Hidden for Production
  /*
  const testDeviceConnection = async () => {
    if (!device) return false;
    
    try {
      console.log('Testing device connection...');
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 5000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('Device connection test successful');
      return true;
    } catch (error: any) {
      console.log('Device connection test failed:', error.message);
      return false;
    }
  };
  */

  // Function to fetch server site name from device
  const fetchServerSiteNameFromDevice = async () => {
    if (!device) {
      console.log('No device available to fetch server site name');
      return;
    }

    try {
      console.log('Fetching server site name from device...');

      // Cancel any existing connection first
      try {
        await manager.cancelDeviceConnection(device.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        // Ignore cancel errors
      }

      // Connect with proper timeout
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
      console.log('Connected to device for server site name fetch');

      // Discover services once
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('Services discovered successfully');

      // Send command to get server site name - try different command formats based on Arduino code
      const commands = [
        '{$send_server_site}',
        '{$send_server_site_name}',
        '{$send_device_config}',
        '{$send_all_data_config}',
        '{$get_server_site}',
        '{$get_server_site_name}'
      ];

      let commandSent = false;
      for (const command of commands) {
        console.log(`Trying command: ${command}`);
        commandSent = await sendCommandInChunks(connectedDevice, command);
        if (commandSent) {
          console.log(`Successfully sent command: ${command}`);
          break;
        }
      }

      if (!commandSent) {
        console.log('Failed to send server site name command');
        return;
      }

      // Monitor F3 for response
      let responseData = '';
      const timeout = setTimeout(() => {
        console.log('Server site name response timeout');
      }, 10000);

      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log('F3 monitoring error for server site name:', error);
            clearTimeout(timeout);
            return;
          }

          if (characteristic && characteristic.value) {
            const newValue = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received server site name data:', newValue);

            responseData += newValue;

            // Check if we have a complete message
            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete server site name message:', completeMessage);
              clearTimeout(timeout);

              // Extract server site name from different possible formats based on Arduino response
              const serverSitePatterns = [
                /Server:([^,}]+)/,  // Matches Server:NODE_001 format
                /server:([^,}]+)/,
                /Server_site:([^,}]+)/,
                /server_site:([^,}]+)/,
                /Site:([^,}]+)/,
                /site:([^,}]+)/,
                /Server_site_name:([^,}]+)/,
                /server_site_name:([^,}]+)/
              ];

              let extractedServerSite = '';
              for (const pattern of serverSitePatterns) {
                const match = completeMessage?.match(pattern);
                if (match && match[1]) {
                  extractedServerSite = match[1].trim();
                  console.log(`Server site name found with pattern ${pattern}:`, extractedServerSite);
                  break;
                }
              }

              if (extractedServerSite) {
                setDeviceServerSiteName(extractedServerSite);
                console.log('Server site name extracted from device:', extractedServerSite);

                // 🔥 NEW: Update parent components and local storage with fresh device data
                if (setServerSiteName) {
                  setServerSiteName(extractedServerSite);
                  console.log('Updated parent component with fresh server site name:', extractedServerSite);
                }

                // Update local storage with fresh device data
                saveToStorage(STORAGE_KEYS.SERVER_SITE_NAME, extractedServerSite);
                console.log('Updated local storage with fresh server site name:', extractedServerSite);
              } else {
                console.log('No server site name found in response:', completeMessage);
              }
            }
          }
        }
      );

    } catch (error: any) {
      console.error('Error fetching server site name from device:', error);
    }
  };

  // Function to fetch IMEI using command '4'
  const fetchIMEIWithCommand4 = async () => {
    if (!device) return;

    try {
      console.log('Fetching IMEI using command "4"...');

      // Connect to device
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();

      // Send command '4' for IMEI
      const commandSent = await sendCommandInChunks(connectedDevice, '4');

      if (!commandSent) {
        console.log('Error: Failed to send command "4"');
        return;
      }

      // Monitor F3 for IMEI response
      let responseData = '';
      // const timeout = setTimeout(() => {
      //   console.log('IMEI response timeout');
      //   console.log('Timeout: No IMEI response received from command "4"');
      // }, 10000);

      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log('F3 monitoring error:', error);
            // clearTimeout(timeout);
            return;
          }

          if (characteristic && characteristic.value) {
            const newValue = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received IMEI data from command "4":', newValue);

            responseData += newValue;

            // Check if we have a complete message
            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete IMEI message from command "4":', completeMessage);
              // clearTimeout(timeout);

              // Show raw response for debugging
              console.log('Raw Response from Command "4":', completeMessage);
              // Extract IMEI from response
              const extractedIMEI = extractIMEIFromLogs(completeMessage);
              setLogsIMEI(extractedIMEI);
              console.log('IMEI Extraction Result:', extractedIMEI || 'No IMEI found');
            }
          }
        }
      );

    } catch (error: any) {
      console.log('Error fetching IMEI with command "4":', error);
      console.log(`Error: Failed to fetch IMEI: ${error.message}`);
    }
  };

  // Function to fetch logs and extract IMEI (legacy method)
  const fetchLogsIMEI = async () => {
    if (!device) return;

    try {
      console.log('Fetching logs to extract IMEI...');

      // Connect to device
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();

      // Send logs command
      const commandSent = await sendCommandInChunks(connectedDevice, '{$send_logs}');

      if (!commandSent) {
        console.log('Error: Failed to send logs command');
        return;
      }

      // Monitor F3 for logs response
      let responseData = '';
      const timeout = setTimeout(() => {
        console.log('Logs response timeout');
        console.log('Timeout: No logs response received');
      }, 10000);

      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log('F3 monitoring error:', error);
            clearTimeout(timeout);
            return;
          }

          if (characteristic && characteristic.value) {
            const newValue = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received logs data:', newValue);

            responseData += newValue;

            // Check if we have a complete message
            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete logs message:', completeMessage);
              clearTimeout(timeout);

              // Extract IMEI from logs
              const extractedIMEI = extractIMEIFromLogs(completeMessage);
              setLogsIMEI(extractedIMEI);

              console.log('IMEI Extracted from logs:', extractedIMEI || 'No IMEI found in logs');
            }
          }
        }
      );

    } catch (error: any) {
      console.log('Error fetching logs IMEI:', error);
      console.log(`Error: Failed to fetch logs: ${error.message}`);
    }
  };



  // Function to refresh device configuration after settings update
  const refreshDeviceConfiguration = async () => {
    try {
      console.log('Refreshing device configuration...');
      await fetchDeviceConfig();
      await fetchSensorData();
      await fetchServerSiteNameFromDevice();

      // Alert.alert(
      //   'Configuration Refreshed',
      //   'Device configuration and sensor data have been updated and refreshed successfully!',
      //   [{ text: 'OK' }]
      // );
    } catch (error: any) {
      console.error('Error refreshing device configuration:', error);
      // Alert.alert('Error', `Failed to refresh configuration: ${error.message}`);
    }
  };

  // Memoized Battery indicator component
  const BatteryIndicator = React.memo(({ level }: { level: number }) => {
    const isLowBattery = level < 30;
    const batteryColor = isLowBattery ? '#f44336' : '#4CAF50';

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
      }}>
        <Icon
          name={isLowBattery ? "battery-alert" : "battery"}
          size={16}
          color="#fff"
        />
        <Text style={{
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          marginLeft: 4,
        }}>
          {level}
        </Text>
      </View>
    );
  });

  // Loading Screen Component
  const DeviceDashboardLoading = () => (
    <View style={{
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}>
      <StatusBar
        backgroundColor={theme.statusBarBg}
        barStyle={theme.statusBar}
        translucent={true}
      />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        padding: scale(16),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
        elevation: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: scale(40),
            height: scale(40),
            borderRadius: scale(20),
            backgroundColor: theme.overlayLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.text, fontSize: scaleFont(24), fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: scaleFont(22), marginLeft: scale(16), flex: 1 }}>Device Dashboard</Text>
      </View>

      {/* Loading Content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
      }}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          marginBottom: 30,
        }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>

        <Text style={{
          fontSize: scaleFont(24),
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: 10,
          textAlign: 'center',
        }}>
          Fetching Device Data
        </Text>

        <Text style={{
          fontSize: scaleFont(16),
          color: theme.textSecondary,
          textAlign: 'center',
          marginBottom: 20,
          lineHeight: 24,
        }}>
          Connecting to device and retrieving real-time status information...
        </Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderRadius: 12,
          elevation: 2,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <Icon name="bluetooth" size={20} color={theme.primary} />
          <Text style={{
            fontSize: scaleFont(14),
            color: theme.textSecondary,
            marginLeft: 10,
          }}>
            Communicating with {device?.name || 'Device'}
          </Text>
        </View>

        <Text style={{
          fontSize: scaleFont(12),
          color: theme.textTertiary,
          textAlign: 'center',
          marginTop: 20,
          fontStyle: 'italic',
        }}>
          Please wait 5-10 seconds for data retrieval
        </Text>
      </View>
    </View>
  );

  // Show loading screen if fetching device data
  if (isLoadingDeviceData) {
    return <DeviceDashboardLoading />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        backgroundColor={theme.statusBarBg}
        barStyle={theme.statusBar}
        translucent={true}
      />
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        padding: scale(16),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
        elevation: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: scale(40),
            height: scale(40),
            borderRadius: scale(20),
            backgroundColor: theme.overlayLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.text, fontSize: scaleFont(24), fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: scaleFont(22), marginLeft: scale(16), flex: 1 }}>Device Dashboard</Text>
        <TouchableOpacity
          onPress={openDrawer}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.overlayLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 4, height: 4, backgroundColor: theme.text, borderRadius: 2, marginBottom: 2 }} />
            <View style={{ width: 4, height: 4, backgroundColor: theme.text, borderRadius: 2, marginBottom: 2 }} />
            <View style={{ width: 4, height: 4, backgroundColor: theme.text, borderRadius: 2 }} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Enhanced Settings Drawer */}
      {showSettingsDrawer && (
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.overlay,
          zIndex: 1000,
          opacity: drawerAnimation,
        }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={closeDrawer}
            activeOpacity={0.8}
          />
          <Animated.View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: isTinyDevice ? '92%' : isSmallDevice ? '88%' : isMediumDevice ? '80%' : isLargeDevice ? '75%' : '70%',
            height: '100%',
            backgroundColor: theme.surface,
            elevation: 15,
            shadowColor: theme.shadow,
            shadowOffset: { width: 8, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            transform: [{
              translateX: drawerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-300, 0],
              })
            }]
          }}>
            {/* Black Background Drawer Header */}
            <View style={{
              backgroundColor: '#000000',
              paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 50 : 50,
              paddingBottom: 20,
              paddingHorizontal: 20,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              elevation: 8,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Image
                  source={require('./src/assets/SWN_CHIEF_LOGO_FINAL.png')}
                  style={{
                    width: 180,
                    height: 100,
                    resizeMode: 'contain',
                  }}
                />
              </View>
            </View>

            {/* Enhanced Drawer Content */}
            <ScrollView style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
              {/* Clean Menu Section Header */}
              <View style={{
                marginBottom: 20,
                paddingHorizontal: 20,
                paddingTop: 16
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.text,
                  marginBottom: 8
                }}>
                  Device Operations
                </Text>
                <View style={{
                  height: 2,
                  backgroundColor: '#E0E0E0',
                  borderRadius: 1
                }} />
              </View>

              {/* Clean Logs Option */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 20,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginBottom: 16,
                  paddingHorizontal: 20,
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: '#2196F3',
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  // Pass the current device if it's connected
                  if (device && device.isConnected) {
                    navigation.navigate('LiveLogs', { device: device });
                  } else {
                    // Show alert that no device is connected
                    // Alert.alert(
                    //   'No Device Connected',
                    //   'Please connect to a BLE device first to view logs.',
                    //   [{ text: 'OK' }]
                    // );
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E3F2FD',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Icon name="file-document" size={24} color="#2196F3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, color: '#333', fontWeight: '600', marginBottom: 4 }}>
                    Live Logs
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                    View real-time BLE device logs and data
                  </Text>
                </View>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#2196F3',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="chevron-right" size={18} color="#fff" />
                </View>
              </TouchableOpacity>


              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 20,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginBottom: 16,
                  paddingHorizontal: 20,
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: '#2196F3',
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  // Pass the current device if it's connected
                  if (device && device.isConnected) {
                    navigation.navigate('Terminal', { device: device });
                  } else {
                    // Show alert that no device is connected
                    // Alert.alert(
                    //   'No Device Connected',
                    //   'Please connect to a BLE device first to view logs.',
                    //   [{ text: 'OK' }]
                    // );
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E3F2FD',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Icon name="file-document" size={24} color="#2196F3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, color: '#333', fontWeight: '600', marginBottom: 4 }}>
                    TERMINAL
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                    Basic Terminal For Debugging
                  </Text>
                </View>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#2196F3',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="chevron-right" size={18} color="#fff" />
                </View>
              </TouchableOpacity>



              {/* White Sensor Calibration Option */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 20,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  marginBottom: 16,
                  paddingHorizontal: 20,
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: '#4CAF50',
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  navigation.navigate('SensorCalibration', { device });
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E8F5E8',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Icon name="tune" size={24} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, color: '#333', fontWeight: '600', marginBottom: 4 }}>
                    Sensor Calibration
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                    Calibrate device sensors for accurate readings
                  </Text>
                </View>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#4CAF50',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="chevron-right" size={18} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Enhanced Settings Option */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 20,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 16,
                  marginBottom: 16,
                  paddingHorizontal: 20,
                  elevation: 3,
                  shadowColor: '#FF9800',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FF9800',
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  navigation.navigate('Settings', {
                    device,
                    serverSiteName,
                    setServerSiteName,
                    selectedSim,
                    setSelectedSim,
                    selectedSensor,
                    setSelectedSensor,
                    selectedDateFormat,
                    setSelectedDateFormat,
                    sensorStates,
                    setSensorStates,
                    gpio_enabled,
                    set_gpio_enabled,
                    dataFreequncy,
                    setDataFreequency,
                    deviceType: deviceStatusData.deviceType
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#fff3e0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Icon name="cog" size={24} color="#FF9800" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, color: '#333', fontWeight: '600', marginBottom: 4 }}>
                    Device Settings
                  </Text>
                  <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                    Configure device parameters and preferences
                  </Text>
                </View>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FF9800',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="chevron-right" size={18} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Quick Actions Section - Hidden for Production */}
              {/* 
              <View style={{ marginTop: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
                  Quick Actions
                </Text>
                <View style={{ height: 2, backgroundColor: '#e0e0e0', borderRadius: 1 }} />
            </View>
              */}

              {/* Device Info Card */}
              {/* Device Information Card - Hidden (Already on Dashboard) */}
              {/* 
              <View style={{
                backgroundColor: '#e3f2fd',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#2196F3',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="information" size={20} color="#2196F3" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 }}>
                    Device Information
                  </Text>
          </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Device Name</Text>
                  <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                    {device?.name || 'Unknown Device'}
                  </Text>
                </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Device ID</Text>
                  <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                    {device?.id || 'N/A'}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Connection Status</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#4CAF50',
                      marginRight: 6,
                    }} />
                    <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: '500' }}>
                      Connected
                    </Text>
                  </View>
                </View>
              </View>
              */}

              {/* Device Configuration Card - Hidden (Already on Dashboard) */}
              {/* 
              <View style={{
                backgroundColor: '#e8f5e8',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#4CAF50',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="cog" size={20} color="#4CAF50" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 }}>
                    Device Configuration
                  </Text>
                </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Server Site</Text>
                  <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                    {deviceServerSiteName || deviceConfigData.Servr_name || 'Not Set'}
                    </Text>
                  </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>SIM Card</Text>
                  <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                    {deviceConfigData.gsm_sim_name || 'Not Set'}
                    </Text>
                  </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Data Frequency</Text>
                  <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                    {deviceConfigData.data_freq ? `${deviceConfigData.data_freq} seconds` : 'Not Set'}
                  </Text>
                </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Date Format</Text>
                  <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                    {deviceConfigData.date_fr || 'Not Set'}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Time Format</Text>
                  <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                    {deviceConfigData.time_fr || 'Not Set'}
                  </Text>
                </View>
              </View>
              */}

              {/* Sensor Configuration Card - Hidden (Already on Dashboard) */}
              {/* 
                  <View style={{
                backgroundColor: '#fff3e0',
                    borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#FF9800',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="tune" size={20} color="#FF9800" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8 }}>
                    Sensor Configuration
                  </Text>
                </View>

                {Object.keys(sensorConfigData).length > 0 ? (
                  <View>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      Sensor calibration data ({Object.keys(sensorConfigData).length} sensors):
                </Text>
                    {Object.entries(sensorConfigData).slice(0, 3).map(([sensorName, sensorInfo]: [string, any]) => (
                      <View key={sensorName} style={{ 
                        backgroundColor: '#fff', 
                    borderRadius: 8,
                        padding: 8, 
                        marginBottom: 6 
                      }}>
                        <Text style={{ fontSize: 12, color: '#333', fontWeight: '600', marginBottom: 2 }}>
                          {sensorName}
                </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 10, color: '#666' }}>
                            Offset: {sensorInfo.offset}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#666' }}>
                            Scale: {sensorInfo.scale}
                          </Text>
                </View>
              </View>
                    ))}
                    {Object.keys(sensorConfigData).length > 3 && (
                      <Text style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
                        +{Object.keys(sensorConfigData).length - 3} more sensors...
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                    No sensor configuration data. Use "Fetch Sensor Config" to get calibration data.
                  </Text>
                )}
              </View>
              */}

              {/* All redundant device info cards hidden - Already displayed on dashboard */}

              {/* Manual Refresh Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#2196F3',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={() => {
                  console.log('🔄 MANUAL REFRESH TRIGGERED');
                  refreshAllDeviceData();
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="refresh" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Manual Refresh Now
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Auto-refresh Interval Control */}
              <View style={{
                backgroundColor: theme.isDark ? theme.card : '#f8f9fa',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderLeftWidth: 3,
                borderLeftColor: '#4CAF50',
              }}>


              </View>

              {/* Debug Device Data Button - Hidden for Production */}
              {/* 
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF9800',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={() => {
                  console.log('Current deviceStatusData:', deviceStatusData);
                  console.log('Current deviceConfigData:', deviceConfigData);
                  
                  const statusInfo = `Current Device Data:\n\nDate: ${deviceStatusData.deviceDate}\nTime: ${deviceStatusData.deviceTime}\nBattery: ${deviceStatusData.batteryLevel}%\nGSM Signal: ${deviceStatusData.gsmSignal}\nData Post: ${deviceStatusData.gsmPostStatus}\nSolar: ${deviceStatusData.solarLevel}%\nLog Count: ${deviceStatusData.logCount}`;
                  
                  const configInfo = Object.keys(deviceConfigData).length > 0 
                    ? `\n\nDevice Config Data:\n${Object.entries(deviceConfigData).map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nIMEI Fields Check (Config):\nIMEI_num: ${deviceConfigData.IMEI_num || 'Not found'}\nIMEI: ${deviceConfigData.IMEI || 'Not found'}\nimei: ${deviceConfigData.imei || 'Not found'}\nimei_num: ${deviceConfigData.imei_num || 'Not found'}\n\nIMEI Fields Check (Status):\nIMEI_num: ${deviceStatusData.IMEI_num || 'Not found'}\nIMEI: ${deviceStatusData.IMEI || 'Not found'}\nimei: ${deviceStatusData.imei || 'Not found'}\nimei_num: ${deviceStatusData.imei_num || 'Not found'}`
                    : '\n\nDevice Config Data: No data received yet\n\nNote: Config data is auto-fetched when dashboard opens. If no data, try clicking "Fetch Device Config" button.';
                  
                  console.log('Debug Info:', statusInfo + configInfo);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="bug" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Debug Device Data
                  </Text>
                </View>
              </TouchableOpacity>
              */}



              {/* Quick Actions Buttons - Hidden */}
              {/* 
              Refresh Configuration Button
              <TouchableOpacity
                style={{
                  backgroundColor: '#4CAF50',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={refreshDeviceConfiguration}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="refresh" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Refresh Configuration
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#E91E63',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={() => {
                  console.log('Available Commands: Your device supports these commands:\n\n' +
                    '• {$send_device_status} - Get device status\n' +
                    '• {$send_device_config} - Get device config\n' +
                    '• {$send_sensor_data} - Get sensor data\n' +
                    '• {$send_all_data_config} - Get all data\n' +
                    '• {$send_logs} - Get device logs\n\n' +
                    'If config command is not working, try other commands to see if device responds.');
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="help-circle" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Check Available Commands
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#4CAF50',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={async () => {
                  const isConnected = await testDeviceConnection();
                  if (isConnected) {
                    console.log('Device connection test successful');
                  } else {
                    console.log('Device connection test failed');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="wifi" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Test Device Connection
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF9800',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={fetchSensorConfig}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="tune" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Fetch Sensor Config
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#9C27B0',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={async () => {
                  const isConnected = await testDeviceConnection();
                  if (isConnected) {
                    fetchServerSiteNameFromDevice();
                  } else {
                    console.log('Device not connected, cannot fetch server site name');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="server" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Fetch Server Site Name
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#607D8B',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  alignItems: 'center',
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={async () => {
                  if (!device) return;
                  
                  try {
                    const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
                    await connectedDevice.discoverAllServicesAndCharacteristics();
                    
                    // Test different commands to see what the device responds to
                    const testCommands = [
                      '{$send_device_status}',
                      '{$send_device_config}',
                      '{$send_all_data_config}',
                      '{$send_logs}',
                      '{$send_server_site}',
                      '{$send_server_site_name}',
                      '{$get_server_site}',
                      '{$get_server_site_name}',
                      '{$set_server_site:TestSite}',
                      '{$set_server_site_name:TestSite}'
                    ];
                    
                    let responses = [];
                    for (const testCommand of testCommands) {
                      console.log(`Testing command: ${testCommand}`);
                      try {
                        const commandSent = await sendCommandInChunks(connectedDevice, testCommand);
                        if (commandSent) {
                          responses.push(`✅ ${testCommand} - Sent successfully`);
                        } else {
                          responses.push(`❌ ${testCommand} - Failed to send`);
                        }
                      } catch (error: any) {
                        responses.push(`❌ ${testCommand} - Error: ${error.message}`);
                      }
                    }
                    
                    console.log('Command test results:', responses.join('\n'));
                    
                  } catch (error: any) {
                    console.error('Failed to test commands:', error.message);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="bug" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 }}>
                    Test Device Commands
                  </Text>
                </View>
              </TouchableOpacity>
              */}

            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Modern Header Section */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                {deviceStatusData.deviceType ? (
                  <View style={{
                    backgroundColor: deviceStatusData.deviceType === 'RMS' ? '#e3f2fd' : '#fff3e0',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: deviceStatusData.deviceType === 'RMS' ? '#2196F3' : '#FF9800',
                  }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      color: deviceStatusData.deviceType === 'RMS' ? '#2196F3' : '#FF9800' 
                    }}>
                      {deviceStatusData.deviceType}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                {device.name || 'Unknown Device'}
              </Text>
                )}
              </View>
              <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                {deviceStatusData.deviceType ? `Device: ${device.name || 'Unknown Device'}` : (isLoadingDeviceData ? 'Waiting for device type...' : 'BLE Connected')}
              </Text>
            </View>


            {/* Manual Refresh Button */}
            {/* <TouchableOpacity
              style={{
                backgroundColor: '#2196F3',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 8,
                marginLeft: 8,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
              onPress={() => {
                refreshAllDeviceData(true); // Show popup for manual refresh
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon 
                  name="refresh" 
                  size={14} 
                  color="#fff" 
                />
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff', marginLeft: 2 }}>
                  Refresh
                </Text>
              </View>
            </TouchableOpacity> */}
            {deviceStatusData.deviceType !== 'RMS' && (
              <View style={{
                backgroundColor: deviceStatusData.batteryLevel < 30 ? '#ffebee' : '#e8f5e8',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: deviceStatusData.batteryLevel < 30 ? '#f44336' : '#4CAF50',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon
                    name={deviceStatusData.batteryLevel < 30 ? "battery-alert" : "battery"}
                    size={16}
                    color={deviceStatusData.batteryLevel < 30 ? '#f44336' : '#4CAF50'}
                  />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: deviceStatusData.batteryLevel < 30 ? '#f44336' : '#4CAF50',
                    marginLeft: 4,
                  }}>
                    {deviceStatusData.batteryLevel}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#e3f2fd',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="server" size={20} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Server</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>{serverSiteName}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#f3e5f5',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="sim" size={20} color="#9C27B0" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>SIM</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>{selectedSim}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#e8f5e8',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="chart-line" size={20} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Sensors</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>


                {(() => {
                  // Use the same deduplication logic as the Active Sensors list
                  const sensors = Object.values(sensorConfigData || {});
                  const uniqueSensorsMap = new Map<string, any>();
                  
                  sensors.forEach((sensor: any) => {
                    const sensorName = sensor?.S_Name || sensor?.sensorName;
                    if (sensorName) {
                      // Only add if not already in map (removes duplicates)
                      if (!uniqueSensorsMap.has(sensorName)) {
                        uniqueSensorsMap.set(sensorName, sensor);
                      }
                    }
                  });
                  
                  // Filter for active sensors only (handle both string "1" and number 1)
                  const activeCount = Array.from(uniqueSensorsMap.values())
                    .filter((sensor: any) => {
                      const isEn = sensor?.is_en;
                      return isEn === 1 || isEn === "1" || isEn === "1.0" || isEn === 1.0;
                    }).length;
                  
                  return activeCount;
                })()} Active
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff3e0',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="wifi" size={20} color="#FF9800" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Network</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>Connected</Text>
            </View>
          </View>


        </View>

        {/* Status Cards Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Device Info Card */}
          <View style={{
            width: '48%',
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#e3f2fd',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="information" size={16} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginLeft: 8 }}>
                Device Info
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Firmware:</Text> {deviceConfigData.Fr_vr || 'v2.1.4'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Latitude:</Text> {deviceConfigData.lat || 'N/A'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              <Text style={{ fontWeight: 'bold' }}>Longitude:</Text> {deviceConfigData.lon || 'N/A'}
            </Text>
          </View>

          {/* Network Status Card */}
          <View style={{
            width: '48%',
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f3e5f5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="wifi" size={16} color="#9C27B0" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text, marginLeft: 8 }}>
                Network
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: deviceStatusData.gsmSignal === 'active' ? '#4CAF50' : '#f44336',
                marginRight: 6,
              }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: deviceStatusData.gsmSignal === 'active' ? '#4CAF50' : '#f44336', fontWeight: 'bold', marginRight: 12 }}>
                  Signal
                </Text>
                {/* GSM Signal Bars */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <View style={{
                    width: 3,
                    height: 8,
                    backgroundColor: deviceStatusData.gsmSignalStrength === 0 ? '#f44336' : '#4CAF50',
                    marginRight: 2,
                    borderRadius: 1,
                  }} />
                  <View style={{
                    width: 3,
                    height: 12,
                    backgroundColor: deviceStatusData.gsmSignalStrength === 0 ? '#ccc' : '#4CAF50',
                    marginRight: 2,
                    borderRadius: 1,
                  }} />
                  <View style={{
                    width: 3,
                    height: 16,
                    backgroundColor: deviceStatusData.gsmSignalStrength === 0 ? '#ccc' : '#4CAF50',
                    marginRight: 2,
                    borderRadius: 1,
                  }} />
                  <View style={{
                    width: 3,
                    height: 20,
                    backgroundColor: deviceStatusData.gsmSignalStrength === 0 ? '#ccc' : '#4CAF50',
                    borderRadius: 1,
                  }} />
                </View>
              </View>
            </View>
            {/* Solar Level - For RMS: only show if data is received, for ACOM: always show */}
            {(deviceStatusData.deviceType !== 'RMS' || deviceStatusData.solarLevel > 0) && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: deviceStatusData.solarLevel > 0 ? '#4CAF50' : '#f44336',
                marginRight: 6,
              }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 12, color: deviceStatusData.solarLevel > 0 ? '#4CAF50' : '#f44336', fontWeight: 'bold', marginRight: 8 }}>
                  Solar Level
                </Text>
                <Text style={{ fontSize: 10, color: deviceStatusData.solarLevel > 0 ? '#4CAF50' : '#f44336' }}>
                  {deviceStatusData.solarLevel}
                </Text>
              </View>
            </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12, color: '#666', fontWeight: 'bold', marginRight: 6 }}>IMEI:</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#333', fontFamily: 'monospace', flex: 1 }}>
                  {(() => {
                    const imeiValue = deviceConfigData.IMEI_num || 'No IMEI data';
                    console.log('IMEI Display Value:', imeiValue);
                    console.log('Device Config Data:', deviceConfigData);
                    console.log('Device Status Data:', deviceStatusData);
                    console.log('sensor Data:', sensorConfigData);
                    console.log('Logs IMEI:', logsIMEI);
                    return imeiValue;
                  })()}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('IMEI Debug Info:');
                    console.log(`Config Data Keys: ${Object.keys(deviceConfigData).join(', ')}`);
                    console.log(`Status Data Keys: ${Object.keys(deviceStatusData).join(', ')}`);
                    console.log(`Config IMEI fields:\nIMEI_num: ${deviceConfigData.IMEI_num || 'Not found'}\nIMEI: ${deviceConfigData.IMEI || 'Not found'}\nimei: ${deviceConfigData.imei || 'Not found'}\nimei_num: ${deviceConfigData.imei_num || 'Not found'}\nimei_number: ${deviceConfigData.imei_number || 'Not found'}`);
                    console.log(`Status IMEI fields:\nIMEI_num: ${deviceStatusData.IMEI_num || 'Not found'}\nIMEI: ${deviceStatusData.IMEI || 'Not found'}\nimei: ${deviceStatusData.imei || 'Not found'}\nimei_num: ${deviceStatusData.imei_num || 'Not found'}\nimei_number: ${deviceStatusData.imei_number || 'Not found'}`);
                    console.log(`Logs IMEI: ${logsIMEI || 'Not extracted yet'}`);
                    // Execute actions directly
                    fetchIMEIWithCommand4();
                    setLogsIMEI('123456789012345');
                    fetchDeviceConfig();
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <Icon name="bug" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sensor Status Card */}
          <View style={{
            width: '48%',
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#e8f5e8',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="chart-line" size={16} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 8 }}>
                Sensors
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Active:</Text> {(() => {
                const sensors = Object.values(sensorConfigData || {});
                const uniqueSensors = new Map();
                sensors.forEach((sensor: any) => {
                  const name = sensor?.S_Name || sensor?.sensorName;
                  if (name) {
                    const isEn = sensor?.is_en;
                    const isActive = isEn === 1 || isEn === "1" || isEn === "1.0" || isEn === 1.0;
                    if (!uniqueSensors.has(name) && isActive) {
                      uniqueSensors.set(name, sensor);
                    }
                  }
                });
                return uniqueSensors.size;
              })()}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              <Text style={{ fontWeight: 'bold' }}>Total:</Text> {(() => {
                const sensors = Object.values(sensorConfigData || {});
                const uniqueSensors = new Set();
                sensors.forEach((sensor: any) => {
                  const name = sensor?.S_Name || sensor?.sensorName;
                  if (name) uniqueSensors.add(name);
                });
                return uniqueSensors.size;
              })()}
            </Text>
          </View>

          {/* Communication Status Card */}
          <View style={{
            width: '48%',
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexShrink: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#fff3e0',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="message-text" size={16} color="#FF9800" />
              </View>
              <Text 
                style={{ 
                  fontSize: 14, 
                  fontWeight: 'bold', 
                  color: theme.text, 
                  marginLeft: 8,
                  flex: 1,
                  flexShrink: 1,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Communication
              </Text>
            </View>
            {/* Mode Display */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexShrink: 1 }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: (deviceConfigData.wifi_enabled_gsm_disabled === 1 || (deviceConfigData as any).wifi_enabled_gsm_disabled === 1) ? '#2196F3' : '#757575',
                marginRight: 6,
                flexShrink: 0,
              }} />
              <Text 
                style={{ 
                  fontSize: 12, 
                  color: (deviceConfigData.wifi_enabled_gsm_disabled === 1 || (deviceConfigData as any).wifi_enabled_gsm_disabled === 1) ? '#2196F3' : '#757575', 
                  fontWeight: 'bold',
                  flex: 1,
                  flexShrink: 1,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Mode : {(deviceConfigData.wifi_enabled_gsm_disabled === 1 || (deviceConfigData as any).wifi_enabled_gsm_disabled === 1) ? 'Wi-Fi' : 'GSM'}
              </Text>
            </View>
            {/* Data Post Display */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexShrink: 1 }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: deviceStatusData.gsmPostStatus === 'on' ? '#4CAF50' : '#f44336',
                marginRight: 6,
                flexShrink: 0,
              }} />
              <Text 
                style={{ 
                  fontSize: 12, 
                  color: deviceStatusData.gsmPostStatus === 'on' ? '#4CAF50' : '#f44336', 
                  fontWeight: 'bold',
                  flex: 1,
                  flexShrink: 1,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Data Post : {deviceStatusData.gsmPostStatus === 'on' ? 'OK' : 'FAIL'}
              </Text>
            </View>
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#4CAF50',
                marginRight: 6,
              }} />
              <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: 'bold' }}>RS485-1 ON</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#f44336',
                marginRight: 6,
              }} />
              <Text style={{ fontSize: 12, color: '#f44336', fontWeight: 'bold' }}>RS485-2 OFF</Text>
            </View> */}

          </View>
        </View>

        {/* Live Data Section */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          elevation: 3,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#e8f5e8',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="chart-line" size={20} color="#4CAF50" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              Device Configs
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                <Text style={{ fontWeight: 'bold' }}>Date:</Text>
              </Text>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                {deviceStatusData.deviceDate}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                <Text style={{ fontWeight: 'bold' }}>Time:</Text>
              </Text>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                {deviceStatusData.deviceTime}
              </Text>
            </View>
          </View>


          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                <Text style={{ fontWeight: 'bold' }}>Data Frequency:</Text>
              </Text>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                {dataFreequncy} minutes
              </Text>
            </View>
            </View>

          {/* WiFi SSID from Device */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                <Text style={{ fontWeight: 'bold' }}>WiFi SSID:</Text>
              </Text>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                {(deviceConfigData as any).wifi_ssid || (deviceConfigData as any).Wifi_ssid || (deviceConfigData as any).WIFI_SSID || 'Not Set'}
              </Text>
            </View>
          </View>

          {/* Backwash Frequency Min from Device - Only show for RMS devices */}
          {deviceStatusData.deviceType === 'RMS' && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  <Text style={{ fontWeight: 'bold' }}>Backwash Frequency Min:</Text>
                </Text>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                  {(deviceConfigData as any).Backwash_frequency_min || (deviceConfigData as any).backwash_frequency_min || (deviceConfigData as any).BACKWASH_FREQUENCY_MIN || 'Not Set'}
                </Text>
              </View>
            </View>
          )}

          {/* PS Delta from Device - Only show for RMS devices */}
          {deviceStatusData.deviceType === 'RMS' && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  <Text style={{ fontWeight: 'bold' }}>PS Delta:</Text>
                </Text>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>
                  {String((deviceConfigData as any).PS_delta || (deviceConfigData as any).ps_delta || (deviceConfigData as any).PS_DELTA || 'Not Set')}
                </Text>
              </View>
            </View>
          )}

        </View>

        {/* Active Sensors List */}
        {/* Active Sensors List */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#e3f2fd',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="tune" size={20} color="#2196F3" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              Active Sensors
            </Text>
          </View>

          {/* Column Headers */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
            marginBottom: 8,
            borderBottomWidth: 2,
            borderBottomColor: theme.border,
          }}>
            <View style={{ width: 8, marginRight: 12 }} />
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: theme.textSecondary,
              flex: 2,
            }}>
              Name
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: theme.textSecondary,
              flex: 1,
              textAlign: 'right',
              marginRight: 12,
            }}>
              Value
            </Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: theme.textSecondary,
              width: 60,
              textAlign: 'center',
            }}>
              Active
            </Text>
          </View>

          {(() => {
            // Convert object to array and remove duplicates based on S_Name
            const sensors = Object.values(sensorConfigData || {});
            const uniqueSensorsMap = new Map<string, any>();
            
            sensors.forEach((sensor: any) => {
              const sensorName = sensor?.S_Name || sensor?.sensorName;
              if (sensorName) {
                // Only add if not already in map (removes duplicates)
                // If duplicate found, keep the one with is_en === 1 if available
                if (!uniqueSensorsMap.has(sensorName)) {
                  uniqueSensorsMap.set(sensorName, sensor);
                } else {
                  // If duplicate exists, prefer the one that is active
                  const existing = uniqueSensorsMap.get(sensorName);
                  const existingIsEn = existing?.is_en;
                  const currentIsEn = sensor?.is_en;
                  const existingIsActive = existingIsEn === 1 || existingIsEn === "1" || existingIsEn === "1.0" || existingIsEn === 1.0;
                  const currentIsActive = currentIsEn === 1 || currentIsEn === "1" || currentIsEn === "1.0" || currentIsEn === 1.0;
                  
                  // If current is active and existing is not, replace it
                  if (currentIsActive && !existingIsActive) {
                    uniqueSensorsMap.set(sensorName, sensor);
                  }
                }
              }
            });
            
            // Filter for active sensors only (handle both string "1" and number 1)
            const activeSensors = Array.from(uniqueSensorsMap.values())
              .filter((sensor: any) => {
                const isEn = sensor?.is_en;
                return isEn === 1 || isEn === "1" || isEn === "1.0" || isEn === 1.0;
              });
            
            console.log("Active sensor list (deduplicated):", activeSensors);
            console.log("Total unique sensors:", uniqueSensorsMap.size);
            console.log("Active sensors count:", activeSensors.length);
            
            return activeSensors.length > 0 ? (
              activeSensors.map((sensor: any, index: number) => {
                const sensorName = sensor?.S_Name || sensor?.sensorName || "Unnamed Sensor";
                return (
                  <View key={`${sensorName}-${index}`} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: index < activeSensors.length - 1 ? 12 : 0,
                    paddingBottom: index < activeSensors.length - 1 ? 12 : 0,
                    borderBottomWidth: index < activeSensors.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#4CAF50',
                      marginRight: 12,
                    }} />
                    <Text style={{
                      fontSize: 14,
                      color: theme.text,
                      flex: 2,
                    }} numberOfLines={1} ellipsizeMode="tail">
                      {sensorName}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#0008efff',
                      flex: 1,
                      textAlign: 'right',
                      marginRight: 12,
                    }} numberOfLines={1}>
                      {sensor?.Val || sensor?.val || "N/A"}
                    </Text>
                    <View style={{
                      backgroundColor: '#e8f5e8',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      width: 60,
                      alignItems: 'center',
                    }}>
                      <Text style={{
                        fontSize: 10,
                        color: '#4CAF50',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}>
                        Active
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Icon name="alert-circle" size={32} color={theme.textTertiary} />
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  No sensors currently active
                </Text>
              </View>
            );
          })()}
        </View>

      </ScrollView>

      {/* Sensor Data Popup */}


      {/* Refresh Pop-up */}
      {showRefreshPopup && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 30,
            margin: 20,
            minWidth: 300,
            alignItems: 'center',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}>
            {/* Refresh Icon */}
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#2196F3',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Icon name="refresh" size={30} color="#fff" />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 10,
              textAlign: 'center',
            }}>
              Refreshing Device Data
            </Text>

            {/* Status */}
            <Text style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              {refreshStatus}
            </Text>

            {/* Progress Bar */}
            <View style={{
              width: '100%',
              height: 8,
              backgroundColor: '#e0e0e0',
              borderRadius: 4,
              marginBottom: 20,
              overflow: 'hidden',
            }}>
              <View style={{
                width: `${refreshProgress}%`,
                height: '100%',
                backgroundColor: '#2196F3',
                borderRadius: 4,
              }} />
            </View>

            {/* Progress Text */}
            <Text style={{
              fontSize: 12,
              color: '#999',
              textAlign: 'center',
            }}>
              {refreshProgress}% Complete
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}




function SettingsScreen({ navigation, route }: { navigation: any; route: any }) {
  const { currentTime } = useTimer();

  const { theme, themeType, setThemeType, toggleTheme } = useTheme();
  const {
    serverSiteName: initialServerSiteName,
    setServerSiteName,
    selectedSim: initialSelectedSim,
    setSelectedSim: setParentSelectedSim,
    selectedSensor: initialSelectedSensor,
    setSelectedSensor: setParentSelectedSensor,
    selectedDateFormat: initialSelectedDateFormat,
    setSelectedDateFormat: setParentSelectedDateFormat,
    sensorStates: initialSensorStates,
    setSensorStates: setParentSensorStates,
    setDataFreequency,
    dataFreequncy: initialDataFreequency,
    gpio_enabled: initial_gpio_enabled,
    set_gpio_enabled,
    device,
    deviceType: initialDeviceType
  } = route.params || {};
  
  // Device type state - used to conditionally show/hide RMS configuration
  const [deviceType, setDeviceType] = useState<string>(initialDeviceType ? String(initialDeviceType).toUpperCase().trim() : '');
  
  console.log('🔍 Settings Screen - Device Type:', deviceType, '| Initial:', initialDeviceType);
  const [serverSiteName, setLocalServerSiteName] = useState(initialServerSiteName || 'Site-001');
  const [selectedSim, setLocalSelectedSim] = useState(initialSelectedSim || 'Jio');
  const [selectedSensor, setLocalSelectedSensor] = useState(initialSelectedSensor || 'Chlorine level');
  const [selectedDateFormat, setLocalSelectedDateFormat] = useState(initialSelectedDateFormat || 'DD/MM/YYYY HH:mm:ss');
  const [sensorStates, setLocalSensorStates] = useState(initialSensorStates || DEFAULT_SENSOR_STATES);
  const [showSimDropdown, setShowSimDropdown] = useState(false);
  const [gpio_enabled, set_local_gpio_enabled] = useState(initial_gpio_enabled || 0);
  const [dataFreequency, setLocalDataFreequency] = useState(initialDataFreequency || 0);
  const [showSensorDropdown, setShowSensorDropdown] = useState(false);
  const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
  const [showDataFrequencyDropdown, setShowDataFrequencyDropdown] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [selectedHours, setSelectedHours] = useState(1);
  const [dataFrequencyChanged, setDataFrequencyChanged] = useState(false); // Track if user changed data frequency
  const deviceDataFrequencyRef = useRef<number>(0); // Store original device data frequency
  const hoursScrollViewRef = useRef<ScrollView>(null);
  const minutesScrollViewRef = useRef<ScrollView>(null);
  const [sensorConfigData, setSensorConfigData] = useState<{ [key: string]: { offset: string, scale: string } }>({});
  const [rawSensorData, setRawSensorData] = useState<string>('');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [wifiEnabledGsmDisabled, setWifiEnabledGsmDisabled] = useState(0);
  const [backwashFrequencyMin, setBackwashFrequencyMin] = useState('');
  const [psDelta, setPsDelta] = useState('');
  const [psEnabledDdpsDisabled, setPsEnabledDdpsDisabled] = useState(0);
  const [numLevelSensor, setNumLevelSensor] = useState(1); // Default 1 (OFF = 1, ON = 2)
  const [backwashTimeSec, setBackwashTimeSec] = useState('');
  
  // Use refs to store latest values for immediate access (bypasses React's async state updates)
  const backwashFrequencyMinRef = useRef('');
  const psDeltaRef = useRef('');
  const psEnabledDdpsDisabledRef = useRef(0);
  const numLevelSensorRef = useRef(1);
  const backwashTimeSecRef = useRef('');
  const wifiSSIDRef = useRef('');
  const wifiPasswordRef = useRef('');
  const wifiEnabledGsmDisabledRef = useRef(0);
  
  const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
  const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
  const F3_NOTIFY_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

  // Load persistent settings on component mount
  useEffect(() => {
    const loadPersistentSettings = async () => {
      console.log('Loading settings from device and local storage...');

      // First, try to get fresh data from device if available
      if (device && device.connectedDevice && device.isConnected) {
        try {
          console.log('Device is connected, fetching fresh settings from device...');

          const connectedDevice = device.connectedDevice;
          await connectedDevice.discoverAllServicesAndCharacteristics();

          const configCommand = '{$send_device_config}';
          const encoded = Buffer.from(configCommand, 'utf8');

          for (let i = 0; i < encoded.length; i += 18) {
            const chunk = encoded.slice(i, i + 18);
            const base64Chunk = chunk.toString('base64');

            await connectedDevice.writeCharacteristicWithoutResponseForService(
              SERVICE_UUID,
              F1_WRITE_UUID,
              base64Chunk
            );

            // await new Promise(resolve => setTimeout(resolve, 50));
          }

          console.log('Fresh device config requested, will update settings when response received');

        } catch (error: any) {
          console.log('Could not fetch fresh device settings:', error.message);
        }
      }

      // Load from local storage as fallback
      const savedSensorConfigData = await loadFromStorage('sensor_config_data', {});
      const savedSensorStates = await loadFromStorage(STORAGE_KEYS.SENSOR_STATES, DEFAULT_SENSOR_STATES);
      const savedServerSiteName = await loadFromStorage(STORAGE_KEYS.SERVER_SITE_NAME, 'Site-001');
      const savedSelectedSim = await loadFromStorage(STORAGE_KEYS.SELECTED_SIM, 'Jio');
      const savedSelectedSensor = await loadFromStorage(STORAGE_KEYS.SELECTED_SENSOR, 'Chlorine level');
      const savedSelectedDateFormat = await loadFromStorage(STORAGE_KEYS.SELECTED_DATE_FORMAT, 'DD/MM/YYYY HH:mm:ss');
      const savedDataFreequency = await loadFromStorage(STORAGE_KEYS.DATA_FREQUENCY, 0);
      const savedGpioEnabled = await loadFromStorage(STORAGE_KEYS.GPIO_ENABLED, 0);
      // Load device type from storage (saved from device config/status)
      const savedDeviceType = await loadFromStorage('device_type', '');
      if (savedDeviceType) {
        const normalizedType = savedDeviceType.toUpperCase().trim();
        setDeviceType(normalizedType);
        console.log('📱 Settings: Loaded device type from storage:', normalizedType);
      } else if (initialDeviceType) {
        const normalizedType = initialDeviceType.toUpperCase().trim();
        setDeviceType(normalizedType);
        console.log('📱 Settings: Using initial device type from params:', normalizedType);
      } else {
        console.log('⚠️ Settings: No device type found in storage or params');
      }
      const savedWifiSSID = await loadFromStorage(STORAGE_KEYS.WIFI_SSID, '');
      const savedWifiPassword = await loadFromStorage(STORAGE_KEYS.WIFI_PASSWORD, '');
      const savedWifiEnabledGsmDisabled = await loadFromStorage(STORAGE_KEYS.WIFI_ENABLED_GSM_DISABLED, 0);
      const savedBackwashFrequencyMin = await loadFromStorage(STORAGE_KEYS.BACKWASH_FREQUENCY_MIN, '');
      const savedPsDelta = await loadFromStorage(STORAGE_KEYS.PS_DELTA, '');
      const savedPsEnabledDdpsDisabled = await loadFromStorage(STORAGE_KEYS.PS_ENABLED_DDPS_DISABLED, 0);
      const savedNumLevelSensor = await loadFromStorage(STORAGE_KEYS.NUM_LEVEL_SENSOR, 1);
      const savedBackwashTimeSec = await loadFromStorage(STORAGE_KEYS.BACKWASH_TIME_SEC, '');

      console.log('Settings: Loaded sensor config data from storage:', Object.keys(savedSensorConfigData).length, 'sensors');
      console.log('Settings: Loaded sensor states from storage:', Object.keys(savedSensorStates).length, 'sensors');
      console.log('Settings: Loaded WiFi SSID from storage:', savedWifiSSID || '(empty)');
      console.log('Settings: Loaded WiFi Password from storage:', savedWifiPassword ? '***' : '(empty)');
      console.log('Settings: Loaded WiFi Enabled GSM Disabled from storage:', savedWifiEnabledGsmDisabled);

      setLocalSensorStates(savedSensorStates);
      setLocalServerSiteName(savedServerSiteName);
      setLocalSelectedSim(savedSelectedSim);
      setLocalSelectedSensor(savedSelectedSensor);
      setLocalSelectedDateFormat(savedSelectedDateFormat);
      setSensorConfigData(savedSensorConfigData);
      setLocalDataFreequency(savedDataFreequency);
      set_local_gpio_enabled(savedGpioEnabled);
      setWifiSSID(savedWifiSSID);
      setWifiPassword(savedWifiPassword);
      setWifiEnabledGsmDisabled(savedWifiEnabledGsmDisabled);
      setBackwashFrequencyMin(savedBackwashFrequencyMin);
      setPsDelta(savedPsDelta);
      setPsEnabledDdpsDisabled(savedPsEnabledDdpsDisabled);
      setNumLevelSensor(savedNumLevelSensor);
      setBackwashTimeSec(savedBackwashTimeSec);
      
      // Initialize data frequency picker from stored value
      if (savedDataFreequency && savedDataFreequency > 0) {
        const totalSeconds = savedDataFreequency;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        setSelectedHours(hours);
        setSelectedMinutes(minutes);
        deviceDataFrequencyRef.current = savedDataFreequency; // Store original device value
        console.log(`📊 Initialized data frequency picker: ${hours}h ${minutes}m (${savedDataFreequency} seconds)`);
        
        // Scroll to correct position after a short delay to ensure ScrollViews are rendered
        setTimeout(() => {
          // Scroll hours ScrollView (each item is 42px: 40px height + 2px margin)
          if (hoursScrollViewRef.current && hours >= 0 && hours < 25) {
            hoursScrollViewRef.current.scrollTo({ y: hours * 42, animated: false });
          }
          
          // Scroll minutes ScrollView - find the index of the minutes value
          const minutesValues = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59];
          const minutesIndex = minutesValues.indexOf(minutes);
          if (minutesScrollViewRef.current && minutesIndex >= 0) {
            minutesScrollViewRef.current.scrollTo({ y: minutesIndex * 42, animated: false });
          }
        }, 100);
      }
      
      // Initialize refs with loaded values
      wifiSSIDRef.current = savedWifiSSID;
      wifiPasswordRef.current = savedWifiPassword;
      wifiEnabledGsmDisabledRef.current = savedWifiEnabledGsmDisabled;
      backwashFrequencyMinRef.current = savedBackwashFrequencyMin;
      psDeltaRef.current = savedPsDelta;
      psEnabledDdpsDisabledRef.current = savedPsEnabledDdpsDisabled;
      numLevelSensorRef.current = savedNumLevelSensor;
      backwashTimeSecRef.current = savedBackwashTimeSec;
    };

    loadPersistentSettings();
  }, []);


  // Handle GPIO enabled toggle
  const handleGpioEnabledToggle = async (value: boolean) => {
    const newValue = value ? 1 : 0;
    set_local_gpio_enabled(newValue);
    await saveToStorage(STORAGE_KEYS.GPIO_ENABLED, newValue);
    if (set_gpio_enabled) {
      set_gpio_enabled(newValue);
    }
  };

  // Update data frequency and save to storage
  // const handleDataFrequencyChange = async () => {
  //   console.log("freequency hours and minutes to calculate", selectedHours,":",selectedMinutes)
  //   const newDataFreq = calculateDataFrequency();
  //   setLocalDataFreequency(newDataFreq);
  //   await saveToStorage(STORAGE_KEYS.DATA_FREQUENCY, newDataFreq);
  //   if (setDataFreequency) {
  //     setDataFreequency(newDataFreq);
  //   }
  // };

  const handleDataFrequencyChange = useCallback(
    async (hours: number, minutes: number) => {
     
      console.log(`📤 Frequency to calculate: ${hours}:${minutes}`);
      const newDataFreq = calculateDataFrequency(hours, minutes);
      setLocalDataFreequency(newDataFreq);
      setDataFrequencyChanged(true); // Mark that user has changed the value
      await saveToStorage(STORAGE_KEYS.DATA_FREQUENCY, newDataFreq);
    },
    [device, setDataFreequency]
  );

  // Auto-scroll to selected values when they change
  useEffect(() => {
    if (selectedHours >= 0 && selectedHours < 25 && hoursScrollViewRef.current) {
      setTimeout(() => {
        hoursScrollViewRef.current?.scrollTo({ y: selectedHours * 42, animated: true });
      }, 100);
    }
  }, [selectedHours]);

  useEffect(() => {
    const minutesValues = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59];
    const minutesIndex = minutesValues.indexOf(selectedMinutes);
    if (minutesIndex >= 0 && minutesScrollViewRef.current) {
      setTimeout(() => {
        minutesScrollViewRef.current?.scrollTo({ y: minutesIndex * 42, animated: true });
      }, 100);
    }
  }, [selectedMinutes]);

  // Update the parent component when server site name changes
  const handleServerSiteNameChange = async (newName: string) => {
    setLocalServerSiteName(newName);
    await saveToStorage(STORAGE_KEYS.SERVER_SITE_NAME, newName);
    if (setServerSiteName) {
      setServerSiteName(newName);
    }

    await sendServerSiteNameToDevice(newName);
  };

  // Handle WiFi SSID change
  const handleWifiSSIDChange = (newSSID: string) => {
    console.log('📝 WiFi SSID changed to:', newSSID);
    // Update state immediately (synchronously) for UI responsiveness
    setWifiSSID(newSSID);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    wifiSSIDRef.current = newSSID;
    // Save to storage asynchronously (non-blocking)
    saveToStorage(STORAGE_KEYS.WIFI_SSID, newSSID).then(() => {
      console.log('💾 WiFi SSID saved to storage');
    }).catch((error) => {
      console.error('Error saving WiFi SSID:', error);
    });
  };

  // Handle WiFi Password change
  const handleWifiPasswordChange = (newPassword: string) => {
    console.log('📝 WiFi Password changed (length):', newPassword.length);
    // Update state immediately (synchronously) for UI responsiveness
    setWifiPassword(newPassword);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    wifiPasswordRef.current = newPassword;
    // Save to storage asynchronously (non-blocking)
    saveToStorage(STORAGE_KEYS.WIFI_PASSWORD, newPassword).then(() => {
      console.log('💾 WiFi Password saved to storage');
    }).catch((error) => {
      console.error('Error saving WiFi Password:', error);
    });
  };

  // Handle WiFi Enabled GSM Disabled toggle
  const handleWifiEnabledGsmDisabledToggle = (value: boolean) => {
    const newValue = value ? 1 : 0;
    console.log('📝 WiFi Enabled GSM Disabled changed to:', newValue);
    setWifiEnabledGsmDisabled(newValue);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    wifiEnabledGsmDisabledRef.current = newValue;
    saveToStorage(STORAGE_KEYS.WIFI_ENABLED_GSM_DISABLED, newValue).then(() => {
      console.log('💾 WiFi Enabled GSM Disabled saved to storage');
    }).catch((error) => {
      console.error('Error saving WiFi Enabled GSM Disabled:', error);
    });
  };

  const handleBackwashFrequencyMinChange = (newValue: string) => {
    console.log('📝 Backwash Frequency Min changed to:', newValue);
    // Update state immediately (synchronously) for UI responsiveness - same as WiFi
    setBackwashFrequencyMin(newValue);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    backwashFrequencyMinRef.current = newValue;
    // Save to storage asynchronously (non-blocking)
    saveToStorage(STORAGE_KEYS.BACKWASH_FREQUENCY_MIN, newValue).then(() => {
      console.log('💾 Backwash Frequency Min saved to storage');
    }).catch((error) => {
      console.error('Error saving Backwash Frequency Min:', error);
    });
  };

  const handlePsDeltaChange = (newValue: string) => {
    console.log('📝 PS Delta changed to:', newValue);
    // Update state immediately (synchronously) for UI responsiveness - same as WiFi
    setPsDelta(newValue);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    psDeltaRef.current = newValue;
    // Save to storage asynchronously (non-blocking)
    saveToStorage(STORAGE_KEYS.PS_DELTA, newValue).then(() => {
      console.log('💾 PS Delta saved to storage');
    }).catch((error) => {
      console.error('Error saving PS Delta:', error);
    });
  };

  const handlePsEnabledDdpsDisabledToggle = (value: boolean) => {
    const newValue = value ? 1 : 0;
    console.log('📝 PS Enabled DDPS Disabled changed to:', newValue);
    // Update state immediately (synchronously) - same as WiFi toggle
    setPsEnabledDdpsDisabled(newValue);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    psEnabledDdpsDisabledRef.current = newValue;
    saveToStorage(STORAGE_KEYS.PS_ENABLED_DDPS_DISABLED, newValue).then(() => {
      console.log('💾 PS Enabled DDPS Disabled saved to storage');
    }).catch((error) => {
      console.error('Error saving PS Enabled DDPS Disabled:', error);
    });
  };

  const handleNumLevelSensorToggle = (value: boolean) => {
    // OFF = 1, ON = 2
    const newValue = value ? 2 : 1;
    console.log('📝 Num Level Sensor changed to:', newValue, value ? '(ON - Two Level)' : '(OFF - Single Level)');
    // Update state immediately (synchronously)
    setNumLevelSensor(newValue);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    numLevelSensorRef.current = newValue;
    saveToStorage(STORAGE_KEYS.NUM_LEVEL_SENSOR, newValue).then(() => {
      console.log('💾 Num Level Sensor saved to storage');
    }).catch((error) => {
      console.error('Error saving Num Level Sensor:', error);
    });
  };

  const handleBackwashTimeSecChange = (newValue: string) => {
    console.log('📝 Backwash Time Sec changed to:', newValue);
    // Update state immediately (synchronously) for UI responsiveness
    setBackwashTimeSec(newValue);
    // Update ref immediately for immediate access (bypasses React's async state updates)
    backwashTimeSecRef.current = newValue;
    // Save to storage asynchronously (non-blocking)
    saveToStorage(STORAGE_KEYS.BACKWASH_TIME_SEC, newValue).then(() => {
      console.log('💾 Backwash Time Sec saved to storage');
    }).catch((error) => {
      console.error('Error saving Backwash Time Sec:', error);
    });
  };

  // Send server site name to device
  const sendServerSiteNameToDevice = async (siteName: string) => {
    try {
      const { device } = route.params || {};
      if (!device) {
        console.log('No device available to send server site name');
        return;
      }

      console.log('Sending server site name to device:', siteName);

      let connectedDevice = device.connectedDevice;
      if (!connectedDevice) {
        try {
          connectedDevice = await manager.connectToDevice(device.id);
          console.log('Connected to device for server site name update');
        } catch (error: any) {
          console.error('Failed to connect to device for server site name update:', error.message);
          return;
        }
      }

      await connectedDevice.discoverAllServicesAndCharacteristics();

      const commands = [
        `{$device_config${siteName}}`,
        `{$set_server_site_name:${siteName}}`,
        `{$update_server_site:${siteName}}`,
        `{$update_server_site_name:${siteName}}`,
        `{$server_site:${siteName}}`,
        `{$server_site_name:${siteName}}`,
        `{$site_name:${siteName}}`
      ];

      let commandSent = false;
      for (const command of commands) {
        console.log(`Trying to send command: ${command}`);
        try {
          commandSent = await sendCommandInChunks(connectedDevice, command);
          if (commandSent) {
            console.log(`Successfully sent command: ${command}`);
            break;
          } else {
            console.log(`Failed to send command: ${command}`);
          }
        } catch (error: any) {
          console.log(`Error sending command ${command}:`, error.message);
          continue;
        }
      }

      if (commandSent) {
        console.log('Server site name sent to device successfully');
      } else {
        console.log('Failed to send any server site name command to device');
      }

    } catch (error: any) {
      console.error('Error sending server site name to device:', error);
    }
  };

  // Update the parent component when SIM selection changes
  const handleSimSelectionChange = async (newSim: string) => {
    setLocalSelectedSim(newSim);
    await saveToStorage(STORAGE_KEYS.SELECTED_SIM, newSim);
    if (setParentSelectedSim) {
      setParentSelectedSim(newSim);
    }
  };

  // Update the parent component when sensor selection changes
  const handleSensorSelectionChange = async (newSensor) => {
    setLocalSelectedSensor(newSensor);
    await saveToStorage(STORAGE_KEYS.SELECTED_SENSOR, newSensor);
    if (setParentSelectedSensor) {
      setParentSelectedSensor(newSensor);
    }
  };

  const sendTimeSyncCommand = async () => {
    try {
      const { device } = route.params || {};
      if (!device) {
        console.log('No device connected. Please connect to a device first.');
        return;
      }

      console.log('Sending complete device configuration to device for PERMANENT overwrite...');

      let connectedDevice = device.connectedDevice;
      if (!connectedDevice) {
        try {
          connectedDevice = await manager.connectToDevice(device.id);
          console.log('Connected to device for configuration update');
        } catch (error: any) {
          console.error('Failed to connect to device for configuration update:', error.message);
          return;
        }
      }

      console.log('=== SENDING TIME SYNC COMMAND TO DEVICE ===');
      const timestamp = Math.floor(Date.now() / 1000);
      const command = `{$time_sync$${timestamp}}`;

      await connectedDevice.discoverAllServicesAndCharacteristics();

      const commandSent = await sendCommandInChunks(connectedDevice, command);

      if (commandSent) {
        console.log('✅ Time sync command sent successfully:', command);
        Alert.alert('Success', 'Time sync command sent successfully.');
        await saveToStorage('timestamp', timestamp);
        return true;
      } else {
        console.log('❌ Failed to send time sync command');
        Alert.alert('Error', 'Failed to send time sync command. Please try again.');
        return false;
      }
    } catch (error: any) {
      console.error('Error sending time sync command:', error);
      Alert.alert('Error', 'An error occurred while sending time sync command.');
      return false;
    }
  };

  // Update the parent component when sensor states change
  const handleSensorStateChange = async (sensorName, isEnabled) => {
    const newSensorStates = { ...sensorStates, [sensorName]: isEnabled };
    setLocalSensorStates(newSensorStates);

    await saveToStorage(STORAGE_KEYS.SENSOR_STATES, newSensorStates);

    if (setParentSensorStates) {
      setParentSensorStates(newSensorStates);
    }
  };

  // Update the parent component when date format changes
  const handleDateFormatChange = async (newFormat) => {
    setLocalSelectedDateFormat(newFormat);
    globalDateFormat = newFormat;
    await saveToStorage(STORAGE_KEYS.SELECTED_DATE_FORMAT, newFormat);
    if (setParentSelectedDateFormat) {
      setParentSelectedDateFormat(newFormat);
    }
  };

  // Calculate data frequency in seconds
  const calculateDataFrequency = (hours,minutes) => {
    return ( (hours * 60 * 60) + (minutes * 60) );
  };

  // Send command in chunks
  const sendCommandInChunks = async (device: any, command: string, chunkSize: number = 18) => {
    try {
      const encoded = Buffer.from(command, 'utf8');
      console.log(`Sending command "${command}" in chunks of ${chunkSize} bytes`);

      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        const base64Chunk = chunk.toString('base64');

        console.log(`Sending chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.toString('utf8')}`);

        await device.writeCharacteristicWithoutResponseForService(
          SERVICE_UUID,
          F1_WRITE_UUID,
          base64Chunk
        );

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('Command sent successfully in chunks');
      return true;
    } catch (error) {
      console.log('Error sending command in chunks:', error);
      return false;
    }
  };

  const parseSensorDataToConfig = (rawResponse: string): {
    [key: string]: { offset: string; scale: string };
  } => {
    try {
      let clean = rawResponse.trim().replace(/^{|}$/g, "").replace(/,+$/, "");
      const tokens = clean.split(
        /,(?=S_Name:|Val:|is_en:|Offset:|Scale:|RS485:|Response:)/
      );
      const sensors: { [key: string]: { offset: string; scale: string } } = {};
      let current: any = {};

      tokens.forEach(token => {
        const [key, value] = token.split(":");
        if (key === "S_Name" && Object.keys(current).length > 0) {
          const name = current["S_Name"] || `Sensor_${Object.keys(sensors).length + 1}`;
          sensors[name] = {
            offset: current["Offset"] || "",
            scale: current["Scale"] || ""
          };
          current = {};
        }
        current[key.trim()] = value?.trim() || "";
      });

      if (Object.keys(current).length > 0) {
        const name = current["S_Name"] || `Sensor_${Object.keys(sensors).length + 1}`;
        sensors[name] = {
          offset: current["Offset"] || "",
          scale: current["Scale"] || ""
        };
      }

      return sensors;
    } catch (err) {
      console.error("❌ Failed to parse sensor config:", err);
      return {};
    }
  };

  const fetchSensorData = async () => {
    if (!device) {
      console.log('❌ No device available');
      return;
    }

    console.log('🚀 Starting sensor data fetch...');

    try {
      try {
        await manager.cancelDeviceConnection(device.id);
        await new Promise(res => setTimeout(res, 500));
      } catch {
        // ignore cancel errors
      }

      console.log('🔌 Connecting to device...');
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Device connected & services discovered');

      const commands = ['{$send_sensor_data}'];
      let response: string | null = null;
      let successfulCommand: string | null = null;

      for (const cmd of commands) {
        try {
          console.log(`➡️ Sending command: ${cmd}`);
          await sendCommandInChunks(connectedDevice, cmd);

          response = await monitorF3ForSensorConfig(connectedDevice);
          if (response) {
            console.log(`✅ Got response for: ${cmd}`);
            successfulCommand = cmd;
            const sensorData = parseSensorDataToConfig(response);
            if (sensorData) {
              console.log("✅ Parsed sensordata:", sensorData);
              setSensorConfigData(sensorData);
              console.log("_____-------------------]]]]]]]][[[[[[", sensorConfigData);
            } else {
              console.log("❌ Failed to parse config response");
            }
            break;
          }
        } catch (err: any) {
          console.log(`⚠️ Command ${cmd} failed: ${err.message}`);
        }
      }

      if (!response) {
        console.log('❌ No sensor data response received from device');
        return;
      }

      console.log(`📦 Raw sensor config response for "${successfulCommand}":`, response);
      return response;

    } catch (err: any) {
      console.log('❌ Error fetching sensor config:', err.message);
      throw err;
    } finally {
      // cleanup logic if needed
    }
  };

  const monitorF3ForSensorConfig = (connectedDevice: Device): Promise<string> => {
    return new Promise((resolve, reject) => {
      let responseData = '';
      const timeoutId = setTimeout(() => {
        console.log('Sensor config response timeout');
        reject(new Error('Sensor config response timeout'));
      }, 10000);

      const subscription = connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('F3 monitoring error (sensor config):', error);
            clearTimeout(timeoutId);
            subscription.remove();
            reject(error);
            return;
          }

          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received F3 data (sensor config):', chunk);
            responseData += chunk;

            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete sensor config message:', completeMessage);
              clearTimeout(timeoutId);
              subscription.remove();
              resolve(completeMessage);
            }
          }
        }
      );
    });
  };

  const parseSensorConfig = (data: string) => {
    try {
      console.log('Parsing sensor config data:', data);

      const sensorData: { [key: string]: { offset: string, scale: string } } = {};
      const sensorNames: string[] = [];

      let currentData = data;
      let startIndex = 0;

      while (true) {
        const sNameIndex = currentData.indexOf('S_Name:', startIndex);
        if (sNameIndex === -1) break;

        const nextSNameIndex = currentData.indexOf('S_Name:', sNameIndex + 7);
        const endIndex = nextSNameIndex !== -1 ? nextSNameIndex : currentData.length;

        const sensorEntry = currentData.substring(sNameIndex + 7, endIndex);
        console.log('Processing sensor entry:', sensorEntry);

        const commaIndex = sensorEntry.indexOf(',');
        if (commaIndex !== -1) {
          const sensorName = sensorEntry.substring(0, commaIndex).trim();
          console.log('Found sensor name:', sensorName);

          if (sensorName) {
            const existingCount = sensorNames.filter(name => name === sensorName).length;
            const uniqueSensorKey = existingCount > 0 ? `${sensorName}_${existingCount + 1}` : sensorName;

            sensorNames.push(uniqueSensorKey);

            const offsetMatch = sensorEntry?.match(/Offset:([^,}]+)/);
            const scaleMatch = sensorEntry?.match(/Scale:([^,}]+)/);

            if (offsetMatch && scaleMatch) {
              sensorData[uniqueSensorKey] = {
                offset: offsetMatch[1].trim(),
                scale: scaleMatch[1].trim()
              };
            } else {
              sensorData[uniqueSensorKey] = {
                offset: '0',
                scale: '1'
              };
            }
          }
        }

        startIndex = sNameIndex + 7;
      }

      console.log('All found sensor names:', sensorNames);
      console.log('Parsed sensor data:', sensorData);
      setSensorConfigData(sensorData);

      const newSensorStates: { [key: string]: boolean } = {};
      sensorNames.forEach(sensorName => {
        newSensorStates[sensorName] = sensorStates[sensorName] !== undefined ? sensorStates[sensorName] : true;
      });

      setLocalSensorStates(newSensorStates);
      saveToStorage(STORAGE_KEYS.SENSOR_STATES, newSensorStates);

      saveToStorage('sensor_config_data', sensorData);

      console.log('Dynamically updated sensor states:', newSensorStates);

    } catch (error) {
      console.error('Error parsing sensor config:', error);
    }
  };

  const sendCompleteDeviceConfig = async () => {
    try {
      console.log('🚀 sendCompleteDeviceConfig called');
      const { device } = route.params || {};
      
      if (!device) {
        console.error('❌ No device in route params');
        Alert.alert('Error', 'No device connected. Please connect to a device first.');
        return;
      }

      console.log('📱 Device found:', device.id, 'Connected:', device.isConnected);
      
      let connectedDevice;
      if (!device.connectedDevice || !device.isConnected) {
        console.log('⚠️ Device not connected, connecting now...');
        try {
          connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
          console.log('✅ Connected to device for configuration update');
        } catch (connectError: any) {
          console.error('❌ Failed to connect to device:', connectError?.message || connectError);
          Alert.alert('Error', `Failed to connect to device: ${connectError?.message || 'Unknown error'}`);
          return;
        }
      } else {
      connectedDevice = device.connectedDevice;
        console.log('✅ Using existing device connection');
      }

      if (!connectedDevice) {
        console.error('❌ No connected device available');
        Alert.alert('Error', 'Failed to get connected device');
        return;
      }

      console.log('Sending complete device configuration to device for PERMANENT overwrite...');

      try {
      await connectedDevice.discoverAllServicesAndCharacteristics();
        console.log('✅ Services and characteristics discovered');
      } catch (discoverError: any) {
        console.error('❌ Failed to discover services:', discoverError?.message || discoverError);
        Alert.alert('Error', `Failed to discover services: ${discoverError?.message || 'Unknown error'}`);
        return;
      }

      // Determine data frequency: use device's stored value if user hasn't changed it
      let finalDataFrequency = dataFreequency;
      if (!dataFrequencyChanged && deviceDataFrequencyRef.current > 0) {
        // User hasn't changed it, use device's stored value
        finalDataFrequency = deviceDataFrequencyRef.current;
        console.log(`📊 Using device's stored data frequency: ${finalDataFrequency} seconds (user didn't change it)`);
      } else {
        // User changed it, calculate from picker values
        finalDataFrequency = calculateDataFrequency(selectedHours, selectedMinutes);
        console.log(`📊 Using user-selected data frequency: ${selectedHours}h ${selectedMinutes}m = ${finalDataFrequency} seconds`);
      }

      const dateFormat = selectedDateFormat.includes('YYYY-MM-DD') ? 'YYYY-MM-DD' :
        selectedDateFormat.includes('MM/DD/YYYY') ? 'MM/DD/YYYY' :
          selectedDateFormat.includes('DD/MM/YYYY') ? 'DD/MM/YYYY' : 'YYYY-MM-DD';

      const timeFormat = selectedDateFormat.includes('HH:mm:ss') ? 'HH:mm:SS' :
        selectedDateFormat.includes('HH:mm') ? 'HH:mm' : 'HH:mm:SS';

      // Use refs to get the latest values immediately (refs are updated synchronously, bypassing React's async state)
      // This ensures we always get the most current value, even if state hasn't re-rendered yet
      const latestBackwashFrequencyMin = backwashFrequencyMinRef.current;
      const latestPsDelta = psDeltaRef.current;
      const latestPsEnabledDdpsDisabled = psEnabledDdpsDisabledRef.current;
      const latestNumLevelSensor = numLevelSensorRef.current;
      const latestBackwashTimeSec = backwashTimeSecRef.current;
      const latestWifiSSID = wifiSSIDRef.current;
      const latestWifiPassword = wifiPasswordRef.current;
      const latestWifiEnabledGsmDisabled = wifiEnabledGsmDisabledRef.current;
      
      console.log('🔍 Using REF values (updated synchronously, always current):');
      console.log('   Backwash_frequency_min (ref):', latestBackwashFrequencyMin || '(empty)');
      console.log('   PS_delta (ref):', latestPsDelta || '(empty)');
      console.log('   PS_enabled_DDPS_disabled (ref):', latestPsEnabledDdpsDisabled === 1 ? 'ON (1)' : 'OFF (0)');
      console.log('   WiFi SSID (ref):', latestWifiSSID || '(empty)');
      console.log('   WiFi Password (ref):', latestWifiPassword ? '***' : '(empty)');
      console.log('   WiFi Enabled GSM Disabled (ref):', latestWifiEnabledGsmDisabled === 1 ? 'ON (1)' : 'OFF (0)');
      
      // Also log state values for comparison
      console.log('🔍 State values (for comparison):');
      console.log('   Backwash_frequency_min (state):', backwashFrequencyMin || '(empty)');
      console.log('   PS_delta (state):', psDelta || '(empty)');
      console.log('   PS_enabled_DDPS_disabled (state):', psEnabledDdpsDisabled === 1 ? 'ON (1)' : 'OFF (0)');
      console.log('   WiFi SSID (state):', wifiSSID || '(empty)');
      console.log('   WiFi Password (state):', wifiPassword ? '***' : '(empty)');
      console.log('   WiFi Enabled GSM Disabled (state):', wifiEnabledGsmDisabled === 1 ? 'ON (1)' : 'OFF (0)');

      console.log('📤 Preparing to send configuration (using state values):');
      console.log('   WiFi SSID:', latestWifiSSID || '(empty)');
      console.log('   WiFi Password:', latestWifiPassword ? '***' : '(empty)');
      console.log('   WiFi Enabled GSM Disabled:', latestWifiEnabledGsmDisabled === 1 ? 'ON (1)' : 'OFF (0)');
      console.log('   Backwash_frequency_min:', latestBackwashFrequencyMin || '(empty)');
      console.log('   PS_delta:', latestPsDelta || '(empty)');
      console.log('   PS_enabled_DDPS_disabled:', latestPsEnabledDdpsDisabled === 1 ? 'ON (1)' : 'OFF (0)');

      const completeConfig = `{$device_config$` +
        `Servr_name:${serverSiteName},` +
        `data_freq:${finalDataFrequency},` +
        `date_fr:${dateFormat},` +
        `time_fr:${timeFormat},` +
        `gpio_extender_enabled:${gpio_enabled},` +
        `gsm_sim_name:${selectedSim.toUpperCase()},` +
        `wifi_ssid:${latestWifiSSID},` +
        `wifi_password:${latestWifiPassword},` +
        `wifi_enabled_gsm_disabled:${latestWifiEnabledGsmDisabled},` +
        `Backwash_frequency_min:${latestBackwashFrequencyMin || ''},` +
        `PS_delta:${latestPsDelta || ''},` +
        `PS_enabled_DDPS_disabled:${latestPsEnabledDdpsDisabled},` +
        `num_level_sensor:${latestNumLevelSensor},` +
        `Backwash_time_sec:${latestBackwashTimeSec || ''}}`;

      console.log('📤 Complete device configuration for PERMANENT overwrite:', completeConfig);
      console.log('📤 RMS values in config string:');
      console.log('   Backwash_frequency_min:', latestBackwashFrequencyMin || '(empty)');
      console.log('   PS_delta:', latestPsDelta || '(empty)');
      console.log('   PS_enabled_DDPS_disabled:', latestPsEnabledDdpsDisabled);

      const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
      const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

      try {
        const encoded = Buffer.from(completeConfig, 'utf8');
        const totalChunks = Math.ceil(encoded.length / 18);
        console.log(`📤 Sending configuration "${completeConfig}" in ${totalChunks} chunks of 18 bytes for PERMANENT overwrite`);
        console.log(`📤 Config string length: ${completeConfig.length} bytes, Encoded length: ${encoded.length} bytes`);

        for (let i = 0; i < encoded.length; i += 18) {
          const chunk = encoded.slice(i, i + 18);
          const base64Chunk = chunk.toString('base64');
          const chunkNumber = Math.floor(i / 18) + 1;

          console.log(`📤 Sending chunk ${chunkNumber}/${totalChunks}: ${chunk.toString('utf8')}`);

          try {
          await connectedDevice.writeCharacteristicWithoutResponseForService(
            SERVICE_UUID,
            F1_WRITE_UUID,
            base64Chunk
          );
            console.log(`✅ Chunk ${chunkNumber}/${totalChunks} sent successfully`);
          } catch (chunkError: any) {
            console.error(`❌ Failed to send chunk ${chunkNumber}/${totalChunks}:`, chunkError?.message || chunkError);
            throw new Error(`Failed to send chunk ${chunkNumber}: ${chunkError?.message || 'Unknown error'}`);
          }

          await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log('✅ Device configuration sent successfully for PERMANENT overwrite');
        console.log('✅ All chunks sent successfully');
        Alert.alert('Success', 'Device Config changed successfully.');





        console.log('✅ PERMANENT UPDATE SUCCESSFUL - Device configuration has been PERMANENTLY overwritten!');
        console.log(`🔄 Server: ${serverSiteName}`);
        console.log(`📱 SIM: ${selectedSim}`);
        console.log(`⏰ Data Frequency: ${finalDataFrequency} seconds (${Math.floor(finalDataFrequency / 3600)}h ${Math.floor((finalDataFrequency % 3600) / 60)}m)`);
        console.log(`📅 Date Format: ${dateFormat}`);
        console.log(`🕐 Time Format: ${timeFormat}`);
        console.log(`🔌 GPIO Extender: ${gpio_enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`📶 WiFi SSID: ${wifiSSID || 'Not set'}`);
        console.log(`📡 WiFi Enabled GSM Disabled: ${wifiEnabledGsmDisabled === 1 ? 'Enabled' : 'Disabled'}`);
        console.log('💾 All old settings have been completely replaced with new values.');
        console.log('🔧 Command "2" has been updated on device.');

        if (setServerSiteName) setServerSiteName(serverSiteName);
        if (setParentSelectedSim) setParentSelectedSim(selectedSim);
        if (setParentSelectedDateFormat) setParentSelectedDateFormat(selectedDateFormat);
        if (setDataFreequency) setDataFreequency(finalDataFrequency);
        if (set_gpio_enabled) set_gpio_enabled(gpio_enabled);

        await saveToStorage(STORAGE_KEYS.SERVER_SITE_NAME, serverSiteName);
        await saveToStorage(STORAGE_KEYS.SELECTED_SIM, selectedSim);
        await saveToStorage(STORAGE_KEYS.SELECTED_DATE_FORMAT, selectedDateFormat);
        await saveToStorage(STORAGE_KEYS.DATA_FREQUENCY, finalDataFrequency);
        await saveToStorage(STORAGE_KEYS.GPIO_ENABLED, gpio_enabled);
        // Save all values to storage using the latest values we just read
        await saveToStorage(STORAGE_KEYS.WIFI_SSID, latestWifiSSID);
        await saveToStorage(STORAGE_KEYS.WIFI_PASSWORD, latestWifiPassword);
        await saveToStorage(STORAGE_KEYS.WIFI_ENABLED_GSM_DISABLED, latestWifiEnabledGsmDisabled);
        await saveToStorage(STORAGE_KEYS.BACKWASH_FREQUENCY_MIN, latestBackwashFrequencyMin);
        await saveToStorage(STORAGE_KEYS.PS_DELTA, latestPsDelta);
        await saveToStorage(STORAGE_KEYS.PS_ENABLED_DDPS_DISABLED, latestPsEnabledDdpsDisabled);
        await saveToStorage(STORAGE_KEYS.NUM_LEVEL_SENSOR, latestNumLevelSensor);
        await saveToStorage(STORAGE_KEYS.BACKWASH_TIME_SEC, latestBackwashTimeSec);


        console.log('Verifying permanent save by requesting device configuration...');


      } catch (error: any) {
        console.error('❌ Error sending device configuration:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        console.log(`❌ Error: Failed to send configuration: ${errorMessage}`);
        Alert.alert('Error', `Failed to send configuration: ${errorMessage}`);
        throw error; // Re-throw to be caught by outer catch
      }

    } catch (error: any) {
      console.error('❌ Error in sendCompleteDeviceConfig:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.log(`❌ Error: Configuration update failed: ${errorMessage}`);
      Alert.alert('Error', `Configuration update failed: ${errorMessage}`);
    }
  };


  
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        backgroundColor={theme.statusBarBg}
        barStyle={theme.statusBar}
        translucent={true}
      />
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.primary,
        padding: scale(16),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
        elevation: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: scale(40),
            height: scale(40),
            borderRadius: scale(20),
            backgroundColor: theme.overlayLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.text, fontSize: scaleFont(24), fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: scaleFont(22), marginLeft: scale(16), flex: 1 }}>Settings</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Modern Settings Header */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          elevation: 3,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.isDark ? '#1a1a1a' : '#e3f2fd',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="cog" size={20} color={theme.info} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              Device Settings
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#e3f2fd',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="server" size={16} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Server</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>{serverSiteName}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f3e5f5',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="sim" size={16} color="#9C27B0" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>SIM</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>{selectedSim}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#e8f5e8',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="tune" size={16} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Sensors</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                {`${Object.values(sensorStates).filter(Boolean).length} Active`}
              </Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#fff3e0',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Icon name="clock-outline" size={16} color="#FF9800" />
              </View>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Time</Text>
              <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>Sync</Text>
            </View>
          </View>
        </View>

        {/* Server Configuration Card */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.isDark ? '#1a1a1a' : '#e3f2fd',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="server" size={16} color={theme.info} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              Server Configuration
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
            Server Site Name
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: theme.text,
              backgroundColor: theme.isDark ? '#2a2a2a' : '#fafafa',
            }}
            value={serverSiteName}
            onChangeText={handleServerSiteNameChange}
            placeholder="Enter server site name"
            placeholderTextColor={theme.textTertiary}
          />

          {/* Data Frequency Picker */}
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 16, marginBottom: 8 }}>
            Data Frequency
          </Text>
          <View style={{
            backgroundColor: theme.isDark ? '#2a2a2a' : '#fafafa',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}>
              {/* Hours Column */}
              <View style={{
                width: 80,
                height: 120,
                alignItems: 'center',
                marginRight: 20
              }}>
                <ScrollView
                  ref={hoursScrollViewRef as any}
                  style={{ height: 120 }}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={42}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: 20 }}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  onMomentumScrollEnd={(event) => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    const newHours = Math.round(offsetY / 42);
                    if (newHours >= 0 && newHours < 25 && newHours !== selectedHours) {
                      setSelectedHours(newHours);
                      handleDataFrequencyChange(newHours, selectedMinutes);
                    }
                  }}
                >
                  {Array.from({ length: 25 }, (_, i) => i).map((value, index) => (
                    <TouchableOpacity
                      key={value}
                      style={{
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: value === selectedHours ? '#FF9800' : 'transparent',
                        borderRadius: 8,
                        marginVertical: 2,
                        width: 60
                      }}
                      onPress={() => {
                        setSelectedHours(value);
                        handleDataFrequencyChange(value, selectedMinutes);
                        // Scroll to selected position
                        setTimeout(() => {
                          hoursScrollViewRef.current?.scrollTo({ y: value * 42, animated: true });
                        }, 50);
                      }}
                    >
                      <Text style={{
                        fontSize: value === selectedHours ? 18 : 16,
                        color: value === selectedHours ? '#fff' : theme.text,
                        fontWeight: value === selectedHours ? 'bold' : 'normal',
                        textAlign: 'center',
                        minWidth: 30
                      }}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  marginTop: 8,
                  fontWeight: 'bold'
                }}>
                  Hours
                </Text>
              </View>

              {/* Minutes Column */}
              <View style={{
                width: 80,
                height: 120,
                alignItems: 'center',
                marginRight: 20
              }}>
                <ScrollView
                  ref={minutesScrollViewRef as any}
                  style={{ height: 120 }}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={42}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: 20 }}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  onMomentumScrollEnd={(event) => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    const minutesIndex = Math.round(offsetY / 42);
                    const minutesValues = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59];
                    if (minutesIndex >= 0 && minutesIndex < minutesValues.length) {
                      const newMinutes = minutesValues[minutesIndex];
                      if (newMinutes !== selectedMinutes) {
                        setSelectedMinutes(newMinutes);
                        handleDataFrequencyChange(selectedHours, newMinutes);
                      }
                    }
                  }}
                >
                  {Array.from({ length: 25 }, (_, i) => {
                    const minutesValues = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59];
                    const value = minutesValues[i] || null;

                    if (value) {
                      return (
                        <TouchableOpacity
                          key={value}
                          style={{
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: value === selectedMinutes ? '#FF9800' : 'transparent',
                            borderRadius: 8,
                            marginVertical: 2,
                            width: 60
                          }}
                          onPress={() => {
                            setSelectedMinutes(value);
                            handleDataFrequencyChange(selectedHours, value);
                            // Scroll to selected position
                            const minutesValues = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59];
                            const minutesIndex = minutesValues.indexOf(value);
                            if (minutesIndex >= 0) {
                              setTimeout(() => {
                                minutesScrollViewRef.current?.scrollTo({ y: minutesIndex * 42, animated: true });
                              }, 50);
                            }
                          }}
                        >
                          <Text style={{
                            fontSize: value === selectedMinutes ? 18 : 16,
                            color: value === selectedMinutes ? '#fff' : theme.text,
                            fontWeight: value === selectedMinutes ? 'bold' : 'normal',
                            textAlign: 'center',
                            minWidth: 30
                          }}>
                            {value}
                          </Text>
                        </TouchableOpacity>
                      );
                    } else {
                      return (
                        <View
                          key={`empty-${i}`}
                          style={{
                            height: 40,
                            width: 60,
                            marginVertical: 2
                          }}
                        />
                      );
                    }
                  })}
                </ScrollView>
                <Text style={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  marginTop: 8,
                  fontWeight: 'bold'
                }}>
                  Minutes
                </Text>
              </View>
            </View>
          </View>

          {/* Save Settings Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              elevation: 3,
              shadowColor: '#4CAF50',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              marginTop: 16,
            }}
            onPress={async () => {
              console.log('🔘 Save button pressed!');
              try {
                await sendCompleteDeviceConfig();
              } catch (error: any) {
                console.error('❌ Error from save button:', error);
                Alert.alert('Error', `Failed to save: ${error?.message || 'Unknown error'}`);
              }
            }}
            activeOpacity={0.8}
          >
            <Icon name="content-save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              💾 PERMANENTLY SAVE SETTINGS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time & Date Settings Card */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.isDark ? '#1a1a1a' : '#fff3e0',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="clock-outline" size={16} color="#FF9800" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              Time & Date Settings
            </Text>
          </View>

          <View style={{
            backgroundColor: theme.isDark ? '#2a2a2a' : '#f8f9fa',
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.success || '#4CAF50',
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.success || '#4CAF50',
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
                shadowColor: theme.shadow || '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
              onPress={sendTimeSyncCommand}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="clock-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#fff',
                  letterSpacing: 0.3,
                }}>
                  Sync Time
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Network Configuration Card */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.isDark ? '#1a1a1a' : '#e8f5e9',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="wifi" size={16} color={theme.success} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              Network Configuration
            </Text>
          </View>

          {/* WiFi Enabled GSM Disabled Toggle */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                WiFi Enabled / GSM Disabled
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                Enable WiFi and disable GSM communication
              </Text>
            </View>
            <Switch
              value={wifiEnabledGsmDisabled === 1}
              onValueChange={handleWifiEnabledGsmDisabledToggle}
              trackColor={{ false: theme.border, true: theme.success }}
              thumbColor={wifiEnabledGsmDisabled === 1 ? theme.text : theme.textSecondary}
            />
          </View>

          {/* WiFi SSID Input */}
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
            WiFi SSID
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: theme.text,
              backgroundColor: wifiEnabledGsmDisabled === 1 ? (theme.isDark ? '#2a2a2a' : '#fafafa') : (theme.isDark ? '#1a1a1a' : '#f0f0f0'),
              marginBottom: 12,
              opacity: wifiEnabledGsmDisabled === 1 ? 1 : 0.5,
            }}
            value={wifiSSID}
            onChangeText={handleWifiSSIDChange}
            placeholder="Enter WiFi SSID"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={wifiEnabledGsmDisabled === 1}
          />

          {/* WiFi Password Input */}
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
            WiFi Password
          </Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                paddingRight: 40,
                fontSize: 14,
                color: theme.text,
                backgroundColor: wifiEnabledGsmDisabled === 1 ? (theme.isDark ? '#2a2a2a' : '#fafafa') : (theme.isDark ? '#1a1a1a' : '#f0f0f0'),
                opacity: wifiEnabledGsmDisabled === 1 ? 1 : 0.5,
              }}
              value={wifiPassword}
              onChangeText={handleWifiPasswordChange}
              placeholder="Enter WiFi Password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry={!showWifiPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={wifiEnabledGsmDisabled === 1}
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 12,
                top: 10,
                padding: 4,
                opacity: wifiEnabledGsmDisabled === 1 ? 1 : 0.3,
              }}
              onPress={() => wifiEnabledGsmDisabled === 1 && setShowWifiPassword(!showWifiPassword)}
              disabled={wifiEnabledGsmDisabled === 0}
            >
              <Icon 
                name={showWifiPassword ? "eye-off" : "eye"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* RMS Configuration Card - Only show for RMS devices */}
        {deviceType === 'RMS' && (
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            elevation: 2,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.isDark ? '#1a1a1a' : '#fff3e0',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="cog" size={16} color={theme.warning} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
                RMS Configuration
              </Text>
            </View>

            {/* Backwash Frequency Min Input */}
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
              Backwash Frequency Min
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: theme.text,
                backgroundColor: theme.isDark ? '#2a2a2a' : '#fafafa',
                marginBottom: 12,
              }}
              value={backwashFrequencyMin}
              onChangeText={handleBackwashFrequencyMinChange}
              placeholder="Enter Backwash Frequency Min"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* PS Delta Input */}
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
              PS Delta
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: theme.text,
                backgroundColor: theme.isDark ? '#2a2a2a' : '#fafafa',
                marginBottom: 12,
              }}
              value={psDelta}
              onChangeText={handlePsDeltaChange}
              placeholder="Enter PS Delta"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Backwash Time Sec Input */}
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
              Backwash Time Sec
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: theme.text,
                backgroundColor: theme.isDark ? '#2a2a2a' : '#fafafa',
                marginBottom: 12,
                opacity: (parseInt(backwashFrequencyMin) || 0) > 0 ? 1 : 0.5,
              }}
              value={backwashTimeSec}
              onChangeText={handleBackwashTimeSecChange}
              placeholder="Enter Backwash Time Sec"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              editable={(parseInt(backwashFrequencyMin) || 0) > 0}
            />

            {/* PS Enabled DDPS Disabled Toggle */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginTop: 8,
              marginBottom: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                  PS Enabled / DDPS Disabled
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  Enable PS and disable DDPS communication
                </Text>
              </View>
              <Switch
                value={psEnabledDdpsDisabled === 1}
                onValueChange={handlePsEnabledDdpsDisabledToggle}
                trackColor={{ false: theme.border, true: theme.success }}
                thumbColor={psEnabledDdpsDisabled === 1 ? theme.text : theme.textSecondary}
              />
            </View>

            {/* Single Level Sensor / Two Level Sensor Toggle */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginTop: 8,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                  Single Level Sensor / Two Level Sensor
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  {numLevelSensor === 2 ? 'Two Level Sensor Selected' : 'Single Level Sensor Selected'}
                </Text>
              </View>
              <Switch
                value={numLevelSensor === 2}
                onValueChange={handleNumLevelSensorToggle}
                trackColor={{ false: theme.border, true: theme.success }}
                thumbColor={numLevelSensor === 2 ? theme.text : theme.textSecondary}
              />
            </View>
          </View>
        )}

        {/* SIM Card Selection Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#f3e5f5',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="sim" size={16} color="#9C27B0" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 12 }}>
              SIM Card Selection
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Select SIM Card
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#fafafa',
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setShowSimDropdown(!showSimDropdown)}
          >
            <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
              {selectedSim}
            </Text>
            <Icon name={showSimDropdown ? "chevron-up" : "chevron-down"} size={16} color="#666" />
          </TouchableOpacity>

          {showSimDropdown && (
            <View style={{
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderRadius: 8,
              marginTop: 4,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                  backgroundColor: selectedSim === 'Jio' ? '#f3e5f5' : 'transparent',
                }}
                onPress={() => {
                  handleSimSelectionChange('Jio');
                  setShowSimDropdown(false);
                }}
              >
                <Text style={{ fontSize: 14, color: selectedSim === 'Jio' ? '#9C27B0' : '#333' }}>
                  Jio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: selectedSim === 'Airtel' ? '#f3e5f5' : 'transparent',
                }}
                onPress={() => {
                  handleSimSelectionChange('Airtel');
                  setShowSimDropdown(false);
                }}
              >
                <Text style={{ fontSize: 14, color: selectedSim === 'Airtel' ? '#9C27B0' : '#333' }}>
                  Airtel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Theme Selection Card */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.isDark ? '#2d2d2d' : '#fff3e0',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="theme-light-dark" size={16} color={theme.isDark ? '#00bcd4' : '#FF9800'} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12 }}>
              App Theme
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 12 }}>
            Choose your preferred app appearance
          </Text>

          {/* Theme Options */}
          <View>
            <TouchableOpacity
              style={{
                backgroundColor: themeType === 'light' ? theme.primary : theme.surface,
                borderWidth: 2,
                borderColor: themeType === 'light' ? theme.primary : theme.border,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
              onPress={() => setThemeType('light')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: themeType === 'light' ? '#ffffff' : (theme.isDark ? '#2d2d2d' : '#e0e0e0'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Icon name="white-balance-sunny" size={20} color={themeType === 'light' ? theme.primary : (theme.isDark ? '#cccccc' : '#666666')} />
                </View>
                <View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: themeType === 'light' ? '#ffffff' : theme.text
                  }}>
                    Light Theme
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: themeType === 'light' ? 'rgba(255,255,255,0.8)' : theme.textSecondary
                  }}>
                    Clean and bright interface
                  </Text>
                </View>
              </View>
              {themeType === 'light' && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="check" size={16} color={theme.primary} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: themeType === 'dark' ? theme.primary : theme.surface,
                borderWidth: 2,
                borderColor: themeType === 'dark' ? theme.primary : theme.border,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
              onPress={() => setThemeType('dark')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: themeType === 'dark' ? '#ffffff' : (theme.isDark ? '#2d2d2d' : '#e0e0e0'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Icon name="moon-waning-crescent" size={20} color={themeType === 'dark' ? theme.primary : (theme.isDark ? '#cccccc' : '#666666')} />
                </View>
                <View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: themeType === 'dark' ? '#ffffff' : theme.text
                  }}>
                    Dark Theme
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: themeType === 'dark' ? 'rgba(255,255,255,0.8)' : theme.textSecondary
                  }}>
                    Easy on the eyes in low light
                  </Text>
                </View>
              </View>
              {themeType === 'dark' && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="check" size={16} color={theme.primary} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: themeType === 'system' ? theme.primary : theme.surface,
                borderWidth: 2,
                borderColor: themeType === 'system' ? theme.primary : theme.border,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => setThemeType('system')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: themeType === 'system' ? '#ffffff' : (theme.isDark ? '#2d2d2d' : '#e0e0e0'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Icon name="cellphone-settings" size={20} color={themeType === 'system' ? theme.primary : (theme.isDark ? '#cccccc' : '#666666')} />
                </View>
                <View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: themeType === 'system' ? '#ffffff' : theme.text
                  }}>
                    System Theme
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: themeType === 'system' ? 'rgba(255,255,255,0.8)' : theme.textSecondary
                  }}>
                    Follows your device settings
                  </Text>
                </View>
              </View>
              {themeType === 'system' && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon name="check" size={16} color={theme.primary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={{
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.border
          }}>
            <View style={{
              backgroundColor: '#fff3cd',
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
              borderLeftWidth: 3,
              borderLeftColor: '#ffc107',
            }}>
              <Text style={{ fontSize: 11, color: '#856404', textAlign: 'center', fontWeight: '500' }}>
                ⚠️ This will PERMANENTLY overwrite all existing device settings
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#2196F3',
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                elevation: 2,
                shadowColor: '#2196F3',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
              onPress={async () => {
                try {
                  const { device } = route.params || {};
                  if (!device) {
                    console.log('No device connected. Please connect to a device first.');
                    return;
                  }

                  console.log('Refreshing settings from device...');

                  let connectedDevice = device.connectedDevice;
                  if (!connectedDevice) {
                    try {
                      connectedDevice = await manager.connectToDevice(device.id);
                      console.log('Connected to device for settings refresh');
                    } catch (error: any) {
                      console.error('Failed to connect to device for settings refresh:', error.message);
                      return;
                    }
                  }

                  await connectedDevice.discoverAllServicesAndCharacteristics();

                  const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
                  const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

                  const configCommand = '{$send_device_config}';
                  const encoded = Buffer.from(configCommand, 'utf8');

                  for (let i = 0; i < encoded.length; i += 18) {
                    const chunk = encoded.slice(i, i + 18);
                    const base64Chunk = chunk.toString('base64');

                    await connectedDevice.writeCharacteristicWithoutResponseForService(
                      SERVICE_UUID,
                      F1_WRITE_UUID,
                      base64Chunk
                    );

                    await new Promise(resolve => setTimeout(resolve, 50));
                  }

                  console.log('🔄 Refresh Requested - Device configuration and sensor data refresh commands sent!');
                  console.log('Check the Device Dashboard and Sensor Management to see the updated settings.');

                } catch (error: any) {
                  console.error('Error refreshing settings from device:', error);
                  console.error('Error refreshing settings:', error.message);
                }
              }}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                🔄 Refresh from Device
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sensor Data Popup for Settings */}
      {/* {rawSensorData && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            margin: 20,
            maxWidth: '90%',
            maxHeight: '80%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                Device Sensor Data
              </Text>
              <TouchableOpacity
                onPress={() => setRawSensorData('')}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#f0f0f0',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={{ fontSize: 14, color: '#333', marginBottom: 8, fontWeight: 'bold' }}>
                Raw Response from Device:
              </Text>
              <View style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                  {rawSensorData}
                </Text>
              </View>
              
              {Object.keys(sensorConfigData).length > 0 && (
                <>
                  <Text style={{ fontSize: 14, color: '#333', marginBottom: 8, fontWeight: 'bold' }}>
                    Parsed Sensor Names:
                  </Text>
                  <View style={{
                    backgroundColor: '#e8f5e8',
                    borderRadius: 8,
                    padding: 12,
                  }}>
                    {Object.keys(sensorConfigData).map((sensorName) => (
                      <View key={sensorName} style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: '#333', fontWeight: 'bold' }}>
                          • {sensorName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setRawSensorData('')}
                style={{
                  backgroundColor: '#666',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setRawSensorData('');
                  // Copy to clipboard functionality could be added here
                }}
                style={{
                  backgroundColor: '#4CAF50',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Copy Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )} */}
    </View>
  );
}


function DeviceDetailsScreen({ route, navigation }: { route: any; navigation: any }) {
  const { device } = route.params;
  const [status, setStatus] = useState('Disconnected');
  const [bonded, setBonded] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [services, setServices] = useState([]);
  const [characteristics, setCharacteristics] = useState({});
  const [loadingServices, setLoadingServices] = useState(false);
  const [writeValue, setWriteValue] = useState('');
  const [writing, setWriting] = useState(false);
  const [notifyStates, setNotifyStates] = useState({});
  const [connectedDevice, setConnectedDevice] = useState(null);


  const CUSTOM_CHAR_UUIDS = [
    '0000fff1-0000-1000-8000-00805f9b34fb',
    '0000fff2-0000-1000-8000-00805f9b34fb',
    '0000fff3-0000-1000-8000-00805f9b34fb',
  ];

  // Cleanup function to unsubscribe from notifications when component unmounts
  useEffect(() => {
    return () => {
      if (connectedDevice) {
        // Cancel all active notifications using the manager
        Object.keys(notifyStates).forEach(charKey => {
          if (notifyStates[charKey]) {
            manager.cancelTransaction(charKey).catch(console.error);
          }
        });
      }
    };
  }, [connectedDevice, notifyStates]);

  const connectAndDiscover = async () => {
    setConnecting(true);



    try {
      const connectedDevice = await manager.connectToDevice(device.id);
      setConnectedDevice(connectedDevice);
      setStatus('Connected');
      setBonded(!!connectedDevice.bonded);
      setLoadingServices(true);

      await connectedDevice.discoverAllServicesAndCharacteristics();
      const svcs = await connectedDevice.services();
      setServices(svcs);



      const charsByService = {};
      for (const svc of svcs) {
        const chars = await connectedDevice.characteristicsForService(svc.uuid);
        const charsWithValue = await Promise.all(chars.map(async (char: any) => {
          let value = null;
          if (char.isReadable) {
            try {
              const readChar = await connectedDevice.readCharacteristicForService(svc.uuid, char.uuid);
              value = Buffer.from(readChar.value, 'base64').toString('utf8');


            } catch (e: any) {
              value = '[Read error]';


            }
          }
          return { ...char, value, serviceUUID: svc.uuid };
        }));
        (charsByService as any)[svc.uuid] = charsWithValue;
      }
      setCharacteristics(charsByService);
      setLoadingServices(false);


    } catch (e) {
      setStatus('Disconnected');
      setLoadingServices(false);



      console.error('Connection error:', e.message);
    }
    setConnecting(false);
  };

  const handleWrite = async (serviceUUID: string, charUUID: string) => {
    setWriting(true);



    try {
      const base64Value = Buffer.from(writeValue, 'utf8').toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(serviceUUID, charUUID, base64Value);



      console.log('Success: Value written to device!');
      setWriteValue('');
    } catch (e: any) {


      console.log('Write error:', e.message);
    }
    setWriting(false);
  };

  const handleNotify = async (serviceUUID, charUUID) => {
    const charKey = `${serviceUUID}-${charUUID}`;
    const isCurrentlyNotifying = notifyStates[charKey];

    try {
      if (isCurrentlyNotifying) {
        // Unsubscribe from notifications using the manager
        await manager.cancelTransaction(charKey);
        setNotifyStates(prev => ({ ...prev, [charKey]: false }));
        console.log('Success: Notifications disabled');
      } else {
        // Subscribe to notifications
        await connectedDevice.monitorCharacteristicForService(
          serviceUUID,
          charUUID,
          (error, characteristic) => {
            if (error) {
              console.log('Notify error:', error);


              return;
            }
            if (characteristic && characteristic.value) {
              const newValue = Buffer.from(characteristic.value, 'base64').toString('utf8');
              console.log('Received notification:', newValue);



              // Update the characteristic value in the state
              setCharacteristics(prev => {
                const newChars = { ...prev };
                if (newChars[serviceUUID]) {
                  newChars[serviceUUID] = newChars[serviceUUID].map(char =>
                    char.uuid === charUUID
                      ? { ...char, value: newValue }
                      : char
                  );
                }
                return newChars;
              });
            }
          },
          charKey
        );
        setNotifyStates(prev => ({ ...prev, [charKey]: true }));
        console.log('Success: Notifications enabled');
      }
    } catch (e) {
      console.log('Notify error:', e.message);
    }
  };

  const handleRead = async (serviceUUID, charUUID) => {


    try {
      const readChar = await connectedDevice.readCharacteristicForService(serviceUUID, charUUID);
      const newValue = Buffer.from(readChar.value, 'base64').toString('utf8');



      // Update the characteristic value in the state
      setCharacteristics(prev => {
        const newChars = { ...prev };
        if (newChars[serviceUUID]) {
          newChars[serviceUUID] = newChars[serviceUUID].map(char =>
            char.uuid === charUUID
              ? { ...char, value: newValue }
              : char
          );
        }
        return newChars;
      });

      console.log('Read Success:', `Value: ${newValue}`);
    } catch (e) {


      console.log('Read error:', e.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (connectedDevice) {
        // Cancel all active notifications first using the manager
        Object.keys(notifyStates).forEach(charKey => {
          if (notifyStates[charKey]) {
            manager.cancelTransaction(charKey).catch(console.error);
          }
        });

        // Use the manager to disconnect the device
        await manager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        setStatus('Disconnected');
        setServices([]);
        setCharacteristics({});
        setNotifyStates({});
        setBonded(false);
        console.log('Device disconnected successfully');
      }
    } catch (e) {
      console.error('Disconnect error:', e);
      // Even if there's an error, reset the state
      setConnectedDevice(null);
      setStatus('Disconnected');
      setServices([]);
      setCharacteristics({});
      setNotifyStates({});
      setBonded(false);
      console.error('Disconnect error:', e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5fafd' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00bcd4', padding: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, marginLeft: 16, flex: 1 }}>BLE-Server</Text>
        {status === 'Connected' ? (
          <TouchableOpacity onPress={handleDisconnect}>
            <Text style={{ color: '#fff', fontSize: 16 }}>DISCONNECT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={connectAndDiscover} disabled={connecting}>
            <Text style={{ color: '#fff', fontSize: 16, opacity: connecting ? 0.5 : 1 }}>CONNECT</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ backgroundColor: '#4a90a4', padding: 10 }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Status <Text style={{ fontWeight: 'bold' }}>{status}</Text></Text>
        {bonded && <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>BONDED</Text>}
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>CUSTOM SERVICE</Text>
        {loadingServices && <ActivityIndicator size="small" color="#00bcd4" />}
        {services.map((svc, idx) => (
          <View key={svc.uuid} style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold' }}>{svc.uuid}</Text>
            {characteristics[svc.uuid] && characteristics[svc.uuid]
              .filter(char => CUSTOM_CHAR_UUIDS.includes(char.uuid.toLowerCase()))
              .map((char, cidx) => (
                <View key={char.uuid} style={{ marginTop: 10, marginLeft: 10, padding: 8, backgroundColor: '#f7f7f7', borderRadius: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: 'bold' }}>CUSTOM CHARACTERISTIC</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {char.isReadable && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#2196F3', marginRight: 6, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>R</Text>
                        </View>
                      )}
                      {(char.isWritableWithResponse || char.isWritableWithoutResponse) && (
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#2196F3', marginRight: 6, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>W</Text>
                        </View>
                      )}
                      {char.isNotifiable && notifyStates[`${svc.uuid}-${char.uuid}`] && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', marginRight: 6, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>N</Text>
                          </View>
                          <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: 'bold' }}>LIVE</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text>UUID: {char.uuid}</Text>
                  <Text>Properties: {char.isReadable ? 'READ' : ''}{char.isWritableWithResponse || char.isWritableWithoutResponse ? (char.isReadable ? ', ' : '') + 'WRITE' : ''}{char.isNotifiable ? (char.isReadable || char.isWritableWithResponse || char.isWritableWithoutResponse ? ', ' : '') + 'NOTIFY' : ''}</Text>
                  {char.value !== null && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ color: '#333' }}>Value: {char.value}</Text>
                      {char.uuid.toLowerCase() === '0000fff3-0000-1000-8000-00805f9b34fb' && (
                        <View style={{ marginTop: 2 }}>
                          <Text style={{ color: '#666', fontSize: 12 }}>Hex: {Buffer.from(char.value, 'utf8').toString('hex')}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {/* Action buttons for characteristics */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
                    {/* Read button */}
                    {char.isReadable && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#4caf50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                        onPress={() => handleRead(svc.uuid, char.uuid)}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Read</Text>
                      </TouchableOpacity>
                    )}

                    {/* Notify buttons */}
                    {char.isNotifiable && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {!notifyStates[`${svc.uuid}-${char.uuid}`] ? (
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#4CAF50',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 6
                            }}
                            onPress={() => handleNotify(svc.uuid, char.uuid)}
                          >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                              ENABLE NOTIFY
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#f44336',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 6
                            }}
                            onPress={() => handleNotify(svc.uuid, char.uuid)}
                          >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                              DISABLE NOTIFY
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Write input for WRITE characteristic */}
                    {(char.uuid.toLowerCase() === '0000fff1-0000-1000-8000-00805f9b34fb') && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, width: '100%' }}>
          <TextInput
                          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 6, flex: 1, marginRight: 8 }}
                          placeholder="Enter value to write"
                          value={writeValue}
                          onChangeText={setWriteValue}
                          editable={!writing}
                        />
                        <TouchableOpacity
                          style={{ backgroundColor: '#0097a7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 }}
                          onPress={() => handleWrite(svc.uuid, char.uuid)}
                          disabled={writing || !writeValue}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{writing ? 'Writing...' : 'Write'}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
          </View>
        ))}
        {!loadingServices && services.length === 0 && (
          <Text style={{ color: '#888' }}>No services found</Text>
        )}
      </View>
    </SafeAreaView>
  );
}





function IBeaconScannerScreen() {
  return <View style={styles.placeholder}><Text>iBeacon Scanner (placeholder)</Text></View>;
}
function AdvertiserScreen() {
  return <View style={styles.placeholder}><Text>Advertiser (placeholder)</Text></View>;
}

function SensorCalibrationScreen({ route, navigation }: { route: any; navigation: any }) {
  const { theme } = useTheme();
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [calibrationData, setCalibrationData] = useState<{ [key: string]: { key: string, offset: string; scale: string, is_en: boolean } }>({});
  const [offsetValue, setOffsetValue] = useState('');
  const [scaleValue, setScaleValue] = useState('');
  const [deviceSensors, setDeviceSensors] = useState<{ [key: string]: { offset: number; scale: number; is_en: number } }>({});
  const [modifiedSensors, setModifiedSensors] = useState<{ [key: string]: boolean }>({});
  const [isLoadingSensors, setIsLoadingSensors] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
  const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
  const F3_NOTIFY_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

  // Load calibration data and device sensors on component mount
  useEffect(() => {
    loadCalibrationData();
    loadDeviceSensors();
    // fetchSensorData();
  }, []);

  // Spinning animation for loading modal
  useEffect(() => {
    if (showLoadingModal) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [showLoadingModal, spinValue]);

  const loadCalibrationData = async () => {
    try {
      const savedData = await loadFromStorage('SENSOR_CALIBRATION_DATA', {});
      setCalibrationData(savedData);
    } catch (error) {
      console.error('Error loading calibration data:', error);
    }
  };

  const saveCalibrationData = async (data: { [key: string]: { offset: string; scale: string, is_en: boolean } }) => {
    try {
      await saveToStorage('SENSOR_CALIBRATION_DATA', data);
    } catch (error) {
      console.error('Error saving calibration data:', error);
    }
  };

  const parseSensorConfig = (data: string) => {
    try {
      console.log('Parsing sensor config data:', data);

      // Remove { } wrapper
      const cleanData = data.replace(/^[{}]+|[{}]+$/g, '');
      console.log('Cleaned sensor config data:', cleanData);

      const sensorData: {
        [key: string]: {
          key: string;
          offset: number;
          scale: number;
          is_en: number;
          val: number;
          rs485: boolean;
          response: string;
        };
      } = {};
      const sensorNames: string[] = []; // Array to store just the sensor names

      // Use while loop to find all S_Name:%s patterns
      let currentData = cleanData;
      let startIndex = 0;

      while (true) {
        // Find next S_Name: occurrence
        const sNameIndex = currentData.indexOf('S_Name:', startIndex);
        if (sNameIndex === -1) break; // No more S_Name: found

        // Find the end of this sensor entry (next S_Name: or end of string)
        const nextSNameIndex = currentData.indexOf('S_Name:', sNameIndex + 7);
        const endIndex = nextSNameIndex !== -1 ? nextSNameIndex : currentData.length;

        // Extract this sensor entry
        const sensorEntry = currentData.substring(sNameIndex + 7, endIndex);
        console.log('Processing sensor entry:', sensorEntry);

        try {
          // Parse the sensor name (everything before first comma)
          const commaIndex = sensorEntry.indexOf(',');
          if (commaIndex === -1) {
            console.log('Skipping sensor entry with no comma');
            startIndex = sNameIndex + 7;
            continue;
          }

          const sensorName = sensorEntry.substring(0, commaIndex).trim();
          console.log('Found sensor name:', sensorName);

          // Skip entries with empty S_Name
          if (!sensorName) {
            console.log('Skipping sensor entry with empty S_Name');
            startIndex = sNameIndex + 7;
            continue;
          }

          // Parse the key (Key:<value>)
          const keyMatch = sensorEntry?.match(/Key:([^,}]+)/);
          const key = keyMatch ? keyMatch[1].trim() : '';

          // Skip entries with empty Key
          if (!key) {
            console.log('Skipping sensor entry with empty Key');
            startIndex = sNameIndex + 7;
            continue;
          }

          // Handle duplicate sensor names
          const existingCount = sensorNames.filter(name => name === sensorName).length;
          const uniqueSensorKey = existingCount > 0 ? `${sensorName}_${existingCount + 1}` : sensorName;
          sensorNames.push(uniqueSensorKey);

          // Extract other fields
          const offsetMatch = sensorEntry?.match(/Offset:([^,}]+)/);
          const scaleMatch = sensorEntry?.match(/Scale:([^,}]+)/);
          const isEnMatch = sensorEntry?.match(/is_en:([^,}]+)/);
          const valMatch = sensorEntry?.match(/Val:([^,}]+)/);
          const rs485Match = sensorEntry?.match(/RS485:([^,}]+)/);
          const responseMatch = sensorEntry?.match(/Response:([^,}]+)/);

          sensorData[uniqueSensorKey] = {
            key,
            offset: offsetMatch ? parseFloat(offsetMatch[1]) : 0,
            scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
            is_en: parseFloat(isEnMatch[1]),
            val: valMatch ? parseFloat(valMatch[1]) : 0,
            rs485: rs485Match ? rs485Match[1].toLowerCase() === 'yes' : false,
            response: responseMatch ? responseMatch[1] : 'Unknown',
          };

          console.log(
            `Parsed sensor: ${uniqueSensorKey}, Key: ${sensorData[uniqueSensorKey].key}, Offset: ${sensorData[uniqueSensorKey].offset
            }, Scale: ${sensorData[uniqueSensorKey].scale}, Active: ${sensorData[uniqueSensorKey].is_en
            }, Val: ${sensorData[uniqueSensorKey].val}, RS485: ${sensorData[uniqueSensorKey].rs485
            }, Response: ${sensorData[uniqueSensorKey].response}`
          );
        } catch (sensorError) {
          console.log('Error parsing individual sensor:', sensorError);
        }

        // Move to next position
        startIndex = sNameIndex + 7;
      }

      console.log('Final parsed sensor config:', sensorData);
      return sensorData;
    } catch (error) {
      console.log('Error parsing sensor config:', error);
      return {};
    }
  };

  const loadDeviceSensors = async () => {
    try {
      const savedDeviceSensors = await loadFromStorage('sensor_config_data', {});
      setDeviceSensors(savedDeviceSensors);
      console.log('Loaded device sensors for calibration:', savedDeviceSensors);
    } catch (error) {
      console.error('Error loading device sensors:', error);
    }
  };

  const buildSensorConfigPacket = (sensors: { [key: string]: { offset: number; scale: number; is_en: number } }) => {
    let packet = '{$sensor_config$';
    Object.entries(sensors).forEach(([sensorKey, config]) => {
      const isActive = config.is_en;
      packet += `Key:${sensorKey},Offset:${config.offset.toFixed(2)},Scale:${config.scale.toFixed(2)},is_en:${isActive},`;
    });
    packet = packet.slice(0, -1) + '}';
    console.log('Built sensor config packet:', packet);
    return packet;
  };

  const sendSensorConfiguration = async (sensors: { [key: string]: { offset: number; scale: number; is_en: number } }) => {
    try {
      let { device } = route.params || {};
      console.log("DEvice in cal", device)
      let connectedDevice;
      if (!device || !device.isConnected) {
        console.log('No device available for sending sensor config');
        connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
        Alert.alert('Error', 'No device available for sending sensor configuration.');
        return false;
      }
      connectedDevice = await device.connectedDevice
      console.log("Connected Device", connectedDevice)
      console.log('=== SENDING SENSOR CONFIGURATION TO DEVICE ===', sensors);

      await connectedDevice.discoverAllServicesAndCharacteristics();

      const configPacket = buildSensorConfigPacket(sensors);
      const commandSent = await sendCommandInChunks(connectedDevice, configPacket);

      if (commandSent) {
        console.log('✅ Sensor configuration sent successfully');
        Alert.alert('Success', 'Sensor configuration sent successfully.');
        return true;
      } else {
        console.log('❌ Failed to send sensor configuration');
        Alert.alert('Error', 'Failed to send sensor configuration. Please try again.');
        return false;
      }
    } catch (error: any) {
      console.error('Error sending sensor configuration:', error);
      Alert.alert('Error', 'An error occurred while sending sensor configuration.');
      return false;
    }
  };

  const fetchSensorData = async () => {
    try {
      const { device } = route.params || {};
      let connectedDevice;
      if (!device) {
        console.log('No device available for fetching sensor data');
       connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
        
      }
      connectedDevice=device.connectedDevice
      console.log('=== FETCHING SENSOR DATA FROM DEVICE ===');
      setShowLoadingModal(true);
       
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const commandSent = await sendCommandInChunks(connectedDevice, '{$send_sensor_data}');

      if (commandSent) {
        const response = await monitorF3ForSensorConfig(connectedDevice);
        if (response) {
          console.log('✅ Sensor data received:', response);
          const parsedData = parseSensorConfig(response);
          setDeviceSensors(parsedData);
          await saveToStorage('sensor_config_data', parsedData);
          return response;
        }
      }

      console.log('❌ No sensor data received');
      Alert.alert('Error', 'No sensor data received from the device.');
      return null;
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      Alert.alert('Error', 'An error occurred while fetching sensor data.');
      return null;
    } finally {
      setShowLoadingModal(false);
    }
  };

  const sendCommandInChunks = async (device: any, command: string, chunkSize: number = 18) => {
    try {
      const encoded = Buffer.from(command, 'utf8');
      console.log(`Sending command "${command}" in chunks of ${chunkSize} bytes`);

      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        const base64Chunk = chunk.toString('base64');

        console.log(`Sending chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.toString('utf8')}`);
        await device.writeCharacteristicWithoutResponseForService(SERVICE_UUID, F1_WRITE_UUID, base64Chunk);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('Command sent successfully in chunks');
      return true;
    } catch (error) {
      console.log('Error sending command in chunks:', error);
      Alert.alert('Error', 'An error occurred while sending command to the device.');
      return false;
    }
  };

  const monitorF3ForSensorConfig = (connectedDevice: Device): Promise<string> => {
    return new Promise((resolve, reject) => {
      let responseData = '';


      const subscription = connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('F3 monitoring error (sensor config):', error);

            subscription.remove();
            reject(error);
            return;
          }

          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('Received F3 data (sensor config):', chunk);
            responseData += chunk;

            if (responseData.includes('{') && responseData.includes('}')) {
              const start = responseData.indexOf('{');
              const end = responseData.indexOf('}') + 1;
              const completeMessage = responseData.substring(start, end);

              console.log('Complete sensor config message:', completeMessage);

              subscription.remove();
              resolve(completeMessage);
            }
          }
        }
      );
    });
  };

  const sensors = Object.keys(deviceSensors);

  const handleSensorPress = (sensor: string) => {
    setSelectedSensor(sensor);
    if (deviceSensors[sensor]) {
      setOffsetValue(calibrationData[sensor]?.offset || deviceSensors[sensor].offset.toString());
      setScaleValue(calibrationData[sensor]?.scale || deviceSensors[sensor].scale.toString());
    } else {
      setOffsetValue(calibrationData[sensor]?.offset || '');
      setScaleValue(calibrationData[sensor]?.scale || '');
    }
  };

  const handleSetCalibration = async () => {
    if (selectedSensor && offsetValue && scaleValue) {
      if (isNaN(parseFloat(offsetValue)) || isNaN(parseFloat(scaleValue))) {
        Alert.alert('Error', 'Please enter valid numeric values for Offset and Scale.');
        return;
      }
      const newData = {
        ...calibrationData,
        [selectedSensor]: {
          offset: offsetValue,
          scale: scaleValue,
        },
      };
      setCalibrationData(newData);
      await saveCalibrationData(newData);
      console.log('Success:', `Calibration set for ${selectedSensor}`);
      Alert.alert('Success', `Calibration set for ${selectedSensor}`);
      setSelectedSensor(null);
      setOffsetValue('');
      setScaleValue('');
    } else {
      console.log('Error: Please enter both Offset and Scale values');
      Alert.alert('Error', 'Please enter both Offset and Scale values.');
    }
  };

  const handleToggleActive = (sensor: string) => {
    console.log(sensor, "toggglglglglg")
    setDeviceSensors(prev => {
      const updated = {
        ...prev,
        [sensor]: { ...prev[sensor], is_en: prev[sensor].is_en == 1 ? 0 : 1 },
      };
      console.log('Updated deviceSensors active state:', updated);
      return updated;
    });
    setModifiedSensors(prev => ({
      ...prev,
      [sensor]: true,
    }));
  };

  const getSensorIcon = (sensor: string) => {
    const sensorName = sensor.toUpperCase();
    if (sensorName.includes('TEMP') || sensorName.includes('TPA') || sensorName.includes('TPW')) {
      return 'thermometer';
    }
    if (sensorName.includes('PH') || sensorName.includes('FLW') || sensorName.includes('UFM')) {
      return 'water';
    }
    if (sensorName.includes('TDS') || sensorName.includes('PSR')) {
      return 'gauge';
    }
    if (sensorName.includes('CLO')) {
      return 'cloud';
    }
    if (sensorName.includes('WGT')) {
      return 'scale';
    }
    if (sensorName.includes('SW')) {
      return 'toggle-switch';
    }
    return 'sensor';
  };

  console.log('deviceSensor calibration screen', deviceSensors);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar backgroundColor={theme.statusBarBg} barStyle={theme.statusBar} translucent={true} />
      <View
            style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.background,
          padding: scale(16),
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.overlayLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Icon name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: scaleFont(22) }}>
            Sensor Calibration
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: scaleFont(12), marginTop: 2 }}>
            Calibrate sensors for accurate readings
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
              borderRadius: 8,
              paddingHorizontal: 12,
            paddingVertical: 8,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          }}
          onPress={async () => {
            console.log('Refreshing sensor data...');
            setIsLoadingSensors(true);
            try {
              await fetchSensorData();
            } catch (error) {
              console.error('Error refreshing sensors:', error);
            } finally {
              setIsLoadingSensors(false);
            }
          }}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="refresh" size={16} color="#fff" />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', marginLeft: 4 }}>
              Refresh
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {Object.keys(deviceSensors).length > 0 && !isLoadingSensors && (
          <View
            style={{
              backgroundColor: theme.success,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check-circle" size={16} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12 }}>
              ✅ {Object.keys(deviceSensors).length} device sensors loaded automatically
            </Text>
          </View>
        )}

        {Object.keys(deviceSensors).length > 0 && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              elevation: 2,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
              📊 Device Sensor Values Summary
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {Object.entries(deviceSensors).map(([sensorName, values]) => (
                <View
                  key={sensorName}
                  style={{
                    backgroundColor: theme.overlayLight,
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 8,
                    minWidth: '48%',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary, marginBottom: 4 }}>
                    {sensorName}
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'monospace' }}>
                    Offset: {values.offset.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, fontFamily: 'monospace' }}>
                    Scale: {values.scale.toFixed(2)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: values.is_en ? theme.success : theme.textSecondary,
                      fontFamily: 'monospace',
                    }}
                  >
                    Status: {values.is_en ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
            Device Sensors
          </Text>
          {sensors.length > 0 ? (
            sensors.map((sensor, index) => (
              <TouchableOpacity
                key={sensor}
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 12,
                  padding: 16,
              marginBottom: 12,
                  elevation: 2,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderWidth: 2,
                  borderColor: modifiedSensors[sensor] ? theme.warning : selectedSensor === sensor ? theme.primary : theme.border,
                }}
                onPress={() => handleSensorPress(sensor)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: selectedSensor === sensor ? theme.primary : theme.overlayLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    <Icon
                      name={getSensorIcon(sensor)}
                      size={24}
                      color={selectedSensor === sensor ? theme.text : theme.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, flex: 1 }}>
                        {sensor}
                      </Text>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: deviceSensors[sensor]?.is_en ? theme.success : theme.textSecondary,
                          marginRight: 8,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => handleToggleActive(sensor)}
                        style={{ padding: 4 }}
                      >
                        <Icon
                          name={deviceSensors[sensor]?.is_en ? 'toggle-switch' : 'toggle-switch-off'}
                          size={24}
                          color={deviceSensors[sensor]?.is_en ? theme.success : theme.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                      {calibrationData[sensor] ? 'Calibrated' : 'Not calibrated'}
                      {modifiedSensors[sensor] && (
                        <Text style={{ color: theme.warning, fontWeight: 'bold' }}> • Modified</Text>
                      )}
                    </Text>
                    {deviceSensors[sensor] && (
                      <View
                        style={{
                          backgroundColor: theme.overlayLight,
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginTop: 2,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600', marginBottom: 4 }}>
                          ⚙️ Calibration Values:
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 2 }}>
                              Offset:
                            </Text>
                            <TextInput
                              style={{
                                backgroundColor: theme.background,
                                borderRadius: 4,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                fontSize: 10,
                                color: theme.text,
                                borderWidth: 1,
                                borderColor: theme.border,
                                fontFamily: 'monospace',
                              }}
                              value={deviceSensors[sensor]?.offset?.toString() || '0'}
                              onChangeText={(text) => {
                                if (text && isNaN(parseFloat(text))) {
                                  Alert.alert('Error', 'Please enter a valid numeric value for Offset.');
                                  return;
                                }
                                const newValue = parseFloat(text) || 0;
                                console.log(`Updating ${sensor} offset to:`, newValue);
                                setDeviceSensors(prev => ({
                                  ...prev,
                                  [sensor]: { ...prev[sensor], offset: newValue },
                                }));
                                setModifiedSensors(prev => ({
                                  ...prev,
                                  [sensor]: true,
                                }));
                              }}
                              keyboardType="numeric"
                              placeholder="0.00"
                              placeholderTextColor={theme.textSecondary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 2 }}>
                              Scale:
                            </Text>
                            <TextInput
                              style={{
                                backgroundColor: theme.background,
                                borderRadius: 4,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                fontSize: 10,
                                color: theme.text,
                                borderWidth: 1,
                                borderColor: theme.border,
                                fontFamily: 'monospace',
                              }}
                              value={deviceSensors[sensor]?.scale?.toString() || '1'}
                              onChangeText={(text) => {
                                if (text && isNaN(parseFloat(text))) {
                                  Alert.alert('Error', 'Please enter a valid numeric value for Scale.');
                                  return;
                                }
                                const newValue = parseFloat(text) || 1;
                                console.log(`Updating ${sensor} scale to:`, newValue);
                                setDeviceSensors(prev => ({
                                  ...prev,
                                  [sensor]: { ...prev[sensor], scale: newValue },
                                }));
                                setModifiedSensors(prev => ({
                                  ...prev,
                                  [sensor]: true,
                                }));
                              }}
                              keyboardType="numeric"
                              placeholder="1.00"
                              placeholderTextColor={theme.textSecondary}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                  {calibrationData[sensor] && (
                    <View
                      style={{
                        backgroundColor: theme.success,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: theme.text, fontWeight: '600' }}>
                        SET
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={{
                backgroundColor: theme.overlayLight,
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="sensor" size={48} color={theme.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, textAlign: 'center', marginBottom: 8 }}>
                No Device Sensors Available
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
                Connect to a device to see sensor calibration options
              </Text>
            </View>
          )}
        </View>

        {/* {selectedSensor && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 20,
              elevation: 4,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' }}>
              Calibrate: {selectedSensor}
          </Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                Offset Value
              </Text>
            <TextInput
              style={{
                  backgroundColor: theme.background,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
                }}
                placeholder="Enter offset value"
                placeholderTextColor={theme.textSecondary}
                value={offsetValue}
                onChangeText={(text) => {
                  setOffsetValue(text);
                }}
                keyboardType="numeric"
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                Scale Value
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.background,
                borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                color: theme.text,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                placeholder="Enter scale value"
                placeholderTextColor={theme.textSecondary}
                value={scaleValue}
                onChangeText={(text) => {
                  setScaleValue(text);
                }}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                elevation: 2,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
              onPress={handleSetCalibration}
              activeOpacity={0.8}
            >
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>
                Set Calibration
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.success,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              elevation: 4,
              shadowColor: theme.success,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={async () => {
              try {
                const sensorConfig: { [key: string]: { offset: number; scale: number; is_en: number } } = {};
                Object.entries(deviceSensors).forEach(([sensorKey, config]) => {
                  sensorConfig[sensorKey] = {

                    offset: config.offset,
                    scale: config.scale,
                    is_en: config.is_en,
                  };
                });

                const success = await sendSensorConfiguration(sensorConfig);

                if (success) {
                  setModifiedSensors({});
                  console.log('✅ Configuration Saved: Sensor configuration has been successfully sent to the device.');
                } else {
                  console.log('❌ Save Failed: Failed to send sensor configuration to device. Please try again.');
                }
              } catch (error) {
                console.error('Error saving configuration:', error);
                console.log('❌ Error: An error occurred while saving the configuration.');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="content-save" size={24} color="#fff" style={{ marginRight: 12 }} />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                Save Configuration to Device
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showLoadingModal && (
        <View
              style={{
                position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 20,
              padding: 30,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 250,
              elevation: 10,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Animated.View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 4,
                borderColor: theme.overlayLight,
                borderTopColor: theme.primary,
                marginBottom: 20,
                transform: [
                  {
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 8, textAlign: 'center' }}>
              🔄 Fetching Device Sensors
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              Connecting to device and retrieving sensor configuration...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}


const Terminal: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme(); // Use custom ThemeContext
  const { device } = route.params || {};
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
  const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
  const F3_NOTIFY_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

  // Parse a single log entry string like "{D:2025-01-01,T:00:00:00,Server:NODE_001,...}"
  const parseLogEntry = (log: string) => {
    const trimmed = log.replace(/^{|}$/g, '');
    const parts = trimmed.split(',');
    let entry: Record<string, string> = {};
    parts.forEach((p) => {
      const [key, value] = p.split(':');
      if (key && value) {
        entry[key.trim()] = value.trim();
      }
    });
    return entry;
  };

  // Send command in chunks to BLE device
  const sendCommandInChunks = async (device: any, command: string, chunkSize: number = 18) => {
    try {
      const encoded = Buffer.from(command, 'utf8');
      console.log(`Sending command "${command}" in chunks of ${chunkSize} bytes`);

      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        const base64Chunk = chunk.toString('base64');
        console.log(`Sending chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.toString('utf8')}`);
        await device.writeCharacteristicWithoutResponseForService(SERVICE_UUID, F1_WRITE_UUID, base64Chunk);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      console.log('Command sent successfully in chunks');
      return true;
    } catch (error) {
      console.log('Error sending command in chunks:', error);
      setError(`Failed to send command: ${error}`);
      return false;
    }
  };

  // Monitor F3_NOTIFY_UUID for device responses
  const monitorF3ForLogs = (device: any) => {
    return new Promise((resolve, reject) => {
      let buffer = '';
      let logs: any[] = [];
      let inactivityTimer: NodeJS.Timeout;
      let maxTimer: NodeJS.Timeout;
      let onceResolved = false;

      const finish = (result: any) => {
        if (onceResolved) return;
        onceResolved = true;
        clearTimeout(inactivityTimer);
        clearTimeout(maxTimer);
        try {
          subscription.remove();
        } catch (e) {
          console.log('⚠️ Tried to remove subscription but it was already gone');
        }
        resolve(result);
      };

      const subscription = device.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log('❌ Error monitoring F3 for logs:', error);
            finish(logs.length ? logs : null);
            return;
          }

          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('📩 F3 log chunk received:', chunk);
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Device Response: ${chunk}`]);

            buffer += chunk;
            let startIdx = buffer.indexOf('{');
            let endIdx = buffer.indexOf('}', startIdx);
            while (startIdx !== -1 && endIdx !== -1) {
              const logEntry = buffer.substring(startIdx, endIdx + 1);
              try {
                const parsed = parseLogEntry(logEntry);
                logs.push(parsed);
                setLogs(prev => [
                  ...prev,
                  `[${new Date().toLocaleTimeString()}] Parsed Response:\n${JSON.stringify(parsed, null, 2)}`,
                ]);
              } catch (e) {
                console.log('⚠️ Failed to parse log entry:', logEntry);
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Failed to parse: ${logEntry}`]);
              }
              buffer = buffer.substring(endIdx + 1);
              startIdx = buffer.indexOf('{');
              endIdx = buffer.indexOf('}', startIdx);
            }

            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
              console.log('⏳ Logs collection inactivity timeout');
              finish(logs.length ? logs : null);
            }, 5000);
          }
        }
      );

      maxTimer = setTimeout(() => {
        console.log('⏰ Max logs monitoring timeout reached');
        finish(logs.length ? logs : null);
      }, 20000);
    });
  };

  // Handle command submission
  const handleCommandSubmit = async () => {
    if (!device) {
      setError('No device selected');
      Alert.alert('Error', 'No device selected');
      return;
    }
    if (!command.trim()) {
      setError('Command cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Command Sent: ${command}`]);

    try {
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Device connected for command');

      const commandSent = await sendCommandInChunks(connectedDevice, command);
      if (commandSent) {
        console.log('✅ Command sent, monitoring for response');
        await monitorF3ForLogs(connectedDevice);
      } else {
        setError('Failed to send command');
        Alert.alert('Error', 'Failed to send command');
      }
    } catch (error) {
      console.log('❌ Error sending command:', error);
      setError(`Error sending command: ${error}`);
      Alert.alert('Error', `Error sending command: ${error}`);
    } finally {
      setIsLoading(false);
    }

    setCommand('');
  };

  // Clear logs
  const clearLogs = async () => {
    if (!device) {
      setError('No device selected');
      Alert.alert('Error', 'No device selected');
      return;
    }

    setIsLoading(true);
    setError('');
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Clearing logs...`]);

    try {
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      const command = '{$delete_logs}';
      const commandSent = await sendCommandInChunks(connectedDevice, command);

      if (commandSent) {
        setLogs([`[${new Date().toLocaleTimeString()}] Logs cleared successfully`]);
        Alert.alert('Success', 'Device logs cleared successfully');
      } else {
        setError('Failed to send clear logs command');
        Alert.alert('Error', 'Failed to send clear logs command');
      }
    } catch (error) {
      console.log('❌ Error clearing logs:', error);
      setError(`Error clearing logs: ${error}`);
      Alert.alert('Error', `Error clearing logs: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  // Initialize with a welcome message
  useEffect(() => {
    setLogs([`[${new Date().toLocaleTimeString()}] Terminal initialized`]);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <View style={[stylesTerminal.loadingContainer]}>
        <StatusBar


          translucent
        />
        <View style={[stylesTerminal.loadingHeader]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={stylesTerminal.backButton}
          >
            <Text style={[stylesTerminal.backButtonText,]}>‹</Text>
            </TouchableOpacity>
          <Text style={[stylesTerminal.headerText]}>Terminal</Text>
          </View>
        <View style={stylesTerminal.loadingContent}>
          <ActivityIndicator size="large" />
          <Text style={[stylesTerminal.loadingText,]}>
            Communicating with {device?.name || 'Device'}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[stylesTerminal.container,]}>
      <StatusBar


        translucent
      />
      {/* Header */}
      <View style={[stylesTerminal.header,]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[stylesTerminal.backButton, { backgroundColor: theme.overlayLight }]}
        >
          <Icon name="arrow-left" size={20} />
        </TouchableOpacity>
        <Text style={[stylesTerminal.headerText,]}>Terminal</Text>
      </View>

      {/* Device Info */}
      {device && (
        <View style={[stylesTerminal.deviceInfo,]}>
          <Text style={[stylesTerminal.deviceInfoTitle, {}]}>
            Connected Device
          </Text>
          <Text style={[stylesTerminal.deviceInfoText,]}>
            Name: {device.name || 'Unknown'}
          </Text>
          <Text style={[stylesTerminal.deviceInfoText, { fontFamily: 'monospace' }]}>
            ID: {device.id}
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={[stylesTerminal.errorContainer, { backgroundColor: theme.errorBackgroundColor || '#ffebee', borderLeftColor: theme.errorColor || '#f44336' }]}>
          <Text style={[stylesTerminal.errorTitle, { color: theme.errorColor || '#c62828' }]}>Error</Text>
          <Text style={[stylesTerminal.errorText, { color: theme.errorColor || '#c62828' }]}>{error}</Text>
        </View>
      )}

      {/* Command Input */}
      <View style={[stylesTerminal.inputContainer, { backgroundColor: theme.inputBackgroundColor || '#2a2a2a', borderTopColor: theme.borderColor || '#333' }]}>
        <Text style={[stylesTerminal.prompt, { color: theme.promptColor || '#0f0' }]}>$</Text>
        <TextInput
          style={[stylesTerminal.input, { backgroundColor: theme.inputFieldColor || '#333' }]}
          value={command}
          onChangeText={setCommand}
          placeholder="Enter command (e.g., {$send_logs})"
          placeholderTextColor={theme.textSecondaryColor || '#888'}
          onSubmitEditing={handleCommandSubmit}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Logs Display */}
      <View style={stylesTerminal.logContainer}>
        <View style={[stylesTerminal.logBox, { backgroundColor: theme.surfaceColor || (isDark ? '#1a1a1a' : '#fff') }]}>
          <View style={stylesTerminal.logHeader}>
            <Text style={[stylesTerminal.logHeaderText,]}>
              Logs ({logs.length} entries)
            </Text>
            <TouchableOpacity onPress={clearLogs} style={stylesTerminal.clearButton}>
              <Icon name="delete" size={20} color={theme.errorColor || '#ff4444'} />
              <Text style={[stylesTerminal.clearButtonText, { color: theme.errorColor || '#ff4444' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={scrollViewRef}
            style={stylesTerminal.scrollView}
            contentContainerStyle={stylesTerminal.scrollContent}
          >
            {logs.length === 0 ? (
              <View style={stylesTerminal.emptyLogs}>
                <Icon name="file-document-outline" size={48} />
                <Text style={[stylesTerminal.emptyLogsText,]}>
                  No logs available{'\n'}Enter a command to interact with the device
                </Text>
              </View>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={[stylesTerminal.logText, { color: theme.logTextColor || '#0f0' }]}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};
const stylesTerminal = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  deviceInfo: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
            borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00bcd4',
  },
  deviceInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deviceInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    marginHorizontal: 20,
    marginBottom: 20,
            padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
            alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  prompt: {
    fontSize: 16,
    color: '#0f0',
    marginRight: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  input: {
    flex: 1,
    fontSize: 14,
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  logContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  logBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logHeader: {
            flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ff4444',
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  logText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    marginBottom: 5,
  },
  emptyLogs: {
    flex: 1,
            justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLogsText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
});
function LiveLogsScreen({ navigation, route }: { navigation: any; route: any }) {
  const theme = useTheme();
  const { device } = route.params || {};
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [logsLoading, setLogsLoading] = useState(false)
  const parseDeviceLogs = (rawLogs: string): string[] => {
    try {
      // Example: if logs are separated by newlines
      return rawLogs.split('\n').filter(line => line.trim() !== '');
    } catch {
      return [];
    }
  };


  const sendCommandInChunks = async (device: any, command: string, chunkSize: number = 18) => {
    try {
      const encoded = Buffer.from(command, 'utf8');
      console.log(`Sending command "${command}" in chunks of ${chunkSize} bytes`);

      for (let i = 0; i < encoded.length; i += chunkSize) {
        const chunk = encoded.slice(i, i + chunkSize);
        const base64Chunk = chunk.toString('base64');

        console.log(`Sending chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.toString('utf8')}`);

        await device.writeCharacteristicWithoutResponseForService(
          SERVICE_UUID,
          F1_WRITE_UUID,
          base64Chunk
        );

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('Command sent successfully in chunks');
      return true;
    } catch (error) {
      console.log('Error sending command in chunks:', error);
      return false;
    }
  };


  const clearLogs = async () => {
    try {
      const { device } = route.params || {};
      if (!device) {
        console.log('No device available for clearing logs');
        Alert.alert('Error', 'No device available for clearing logs.');
        return;
      }

      console.log('=== CLEARING DEVICE LOGS ===');

      // Cancel any existing connection
      try {
        await manager.cancelDeviceConnection(device.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log('Ignoring cancel connection error for log clearing');
      }

      // Connect to device
      console.log('🔌 Connecting to device for log clearing...');
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Device connected & services discovered for log clearing');

      // Send delete logs command
      const command = '{$delete_logs}';
      console.log(`➡️ Sending delete log command: "${command}"`);
      const commandSent = await sendCommandInChunks(connectedDevice, command);

      if (commandSent) {
        console.log('✅ Delete logs command sent successfully');
        setLogs([]); // Clear local logs
        setError(''); // Clear error state
        Alert.alert('Success', 'Device logs cleared successfully.');
      } else {
        console.log('❌ Failed to send delete logs command');
        Alert.alert('Error', 'Failed to send delete logs command. Please try again.');
      }
    } catch (error: any) {
      console.error('Error clearing logs:', error.message);
      Alert.alert('Error', 'An error occurred while clearing logs.');
    }
  };
  const DEVICE_STATUS_COMMAND = '{$send_device_status}';
  const SERVICE_UUID = '00000180-0000-1000-8000-00805f9b34fb';
  const F1_WRITE_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
  const F3_NOTIFY_UUID = '0000fff3-0000-1000-8000-00805f9b34fb';

  const addTestLog = () => {
    fetchDeviceLogs()
    // const timestamp = new Date().toLocaleTimeString();
    // setLogs(prev => [...prev, `[${timestamp}] Test log entry added`]);
  };

  // Parse a single log entry string like "{D:2025-01-01,T:00:00:00,Server:NODE_001,...}"
  const parseLogEntry = (logEntry: string): Record<string, any> | null => {
    try {
      // Remove surrounding braces if any
      const cleaned = logEntry.replace(/^[{}]+|[{}]+$/g, '');
      console.log('Parsing log entry:', cleaned);
      const pairs = cleaned.split(',');
      const logData: Record<string, any> = {};
      pairs.forEach(pair => {
        const [key, value] = pair.split(':');
        if (key && value !== undefined) {
          const cleanKey = key.trim();
          const cleanValue = value.trim();
          logData[cleanKey] = cleanValue;
          console.log(`Parsed log: ${cleanKey} = ${cleanValue}`);
        }
      });
      return Object.keys(logData).length > 0 ? logData : null;
    } catch (error) {
      console.warn('⚠️ Failed to parse log entry:', error);
      return null;
    }
  };

  const monitorF3ForLogs = (device: any) => {
    return new Promise((resolve, reject) => {
      let buffer = '';
      let logs: any[] = [];
      let inactivityTimer: NodeJS.Timeout;
      let maxTimer: NodeJS.Timeout;
      let onceResolved = false;

      const finish = (result: any) => {
        if (onceResolved) return;
        onceResolved = true;
        clearTimeout(inactivityTimer);
        clearTimeout(maxTimer);
        try {
          subscription.remove();
          console.log('✅ Removed log subscription');
        } catch (e) {
          console.warn('⚠️ Tried to remove subscription but it was already gone');
        }
        resolve(result);
      };

      const subscription = device.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Notification error:', error);
            if (error.message.includes('Device was disconnected') || error.message.includes('not found')) {
              // Handle disconnection gracefully
            }
           
          }

          if (characteristic?.value) {
            const chunk = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('📩 F3 log chunk received:', chunk);

            buffer += chunk;

            // Extract complete log blocks between {$log_start$} and {$log_end$}
            let startIdx = buffer.indexOf('{$log_start$}');
            let endIdx = buffer.indexOf('{$log_end$}');
            while (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
              const logBlock = buffer.substring(startIdx + 13, endIdx); // Skip {$log_start$}
              console.log('📜 Extracted log block:', logBlock);

              // Parse multiple JSON-like objects within the block
              let jsonStart = logBlock.indexOf('{');
              let jsonEnd = logBlock.indexOf('}', jsonStart);
              while (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonEntry = logBlock.substring(jsonStart, jsonEnd + 1);
                try {
                  const parsed = parseLogEntry(jsonEntry);
                  if (parsed) {
                    logs.push(parsed);
                    console.log('✅ Parsed log entry:', parsed);
                  }
                } catch (e) {
                  console.warn('⚠️ Failed to parse log entry:', jsonEntry, e);
                }
                // Move to the next JSON object
                jsonStart = logBlock.indexOf('{', jsonEnd + 1);
                jsonEnd = logBlock.indexOf('}', jsonStart);
              }

              buffer = buffer.substring(endIdx + 9); // Skip {$log_end$}
              startIdx = buffer.indexOf('{$log_start$}');
              endIdx = buffer.indexOf('{$log_end$}');
            }

            // Reset inactivity timeout (5s)
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
              console.log('⏳ Logs collection inactivity timeout');
              finish(logs.length ? logs : null);
            }, 15000);
          }
        }
      );

    
    });
  };




  const monitorF3ForDeviceConfig = async (device: any) => {
    return new Promise((resolve) => {
      let responseBuffer = '';
      let timeout: NodeJS.Timeout;

      const subscription = device.monitorCharacteristicForService(
        SERVICE_UUID,
        F3_NOTIFY_UUID,
        (error: any, characteristic: any) => {
          if (error) {
            console.log('Error monitoring F3 for config:', error);
            clearTimeout(timeout);
            resolve(null);
            return;
          }

          if (characteristic && characteristic.value) {
            const value = Buffer.from(characteristic.value, 'base64').toString('utf8');
            console.log('F3 config data received:', value);

            responseBuffer += value;

            // Check if we have a complete config response (look for {...} pattern)
            if (responseBuffer.includes('{') && responseBuffer.includes('}')) {
              const startIndex = responseBuffer.indexOf('{');
              const endIndex = responseBuffer.lastIndexOf('}');

              if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                const completeResponse = responseBuffer.substring(startIndex, endIndex + 1);
                console.log('Complete config response:', completeResponse);

                clearTimeout(timeout);
                subscription.remove();
                resolve(completeResponse);
                return;
              }
            }
          }
        }
      );

      // Set timeout for config response
      timeout = setTimeout(() => {
        console.log('Timeout waiting for device config response');
        subscription.remove();
        resolve(null);
      }, 10000); // 10 second timeout
    });
  };

  const fetchDeviceLogs = async () => {
    let connectedDevice;
    if (!device) {
      console.log('❌ No device available for log fetch');
      connectedDevice = await manager.connectToDevice(device.id, { timeout: 15000 });
      
    }
    connectedDevice = device.connectedDevice;
    setLogsLoading(true)
    console.log('=== STARTING DEVICE LOG FETCH ===');
    try {

      console.log('✅ Device connected for log fetch');

      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Services discovered for log fetch');

      const commandsToTry = ['{$send_logs}'];
      let response: any = null;

      for (const command of commandsToTry) {
        console.log(`➡ Sending log command: "${command}"`);
        await sendCommandInChunks(connectedDevice, command);

        response = await monitorF3ForLogs(connectedDevice);
        if (response && response.length > 0) {
          console.log(`✅ Logs received for command: "${command}"`);
          break;
        }
      }

      if (response && response.length > 0) {
        console.log("✅ Parsed logs:", response);
        setLogs((prev) => [...prev, ...response]);
      } else {
        console.log("❌ No logs received from device");
      }
    } catch (error) {
      console.log('❌ Error fetching logs:', error);
    }
    console.log('=== DEVICE LOG FETCH COMPLETED ===');
    setLogsLoading(false)
  };


  const exportLogsToExcel = async () => {
    try {
      if (!logs || logs.length === 0) {
        alert("No logs available to export");
        return;
      }

      // Convert logs to worksheet
      const ws = XLSX.utils.json_to_sheet(logs);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs");

      // Write file as base64
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      // Define file path
      const filePath = `${RNFS.DownloadDirectoryPath}/logs_${Date.now()}.xlsx`;

      // Save file
      await RNFS.writeFile(filePath, wbout, 'base64');

      alert(`Logs exported successfully:\n${filePath}`);
    } catch (error) {
      console.error("Error exporting logs:", error);
      alert("Failed to export logs");
    }
  };

  const DeviceLogsLoading = () => (
    <View style={{
      flex: 1,
      backgroundColor: "#121212", // dark background
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}>
      <StatusBar
        backgroundColor="#1E1E1E" // dark status bar
        barStyle="light-content"
        translucent={true}
      />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#1E1E1E", // dark header
        padding: scale(16),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: scale(40),
            height: scale(40),
            borderRadius: scale(20),
            backgroundColor: "rgba(255,255,255,0.1)", // light overlay
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: scaleFont(24), fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: "#FFFFFF", fontWeight: 'bold', fontSize: scaleFont(22), marginLeft: scale(16), flex: 1 }}>
          Device Logs
        </Text>
      </View>

      {/* Loading Content */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
      }}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#333333", // dark circle
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          marginBottom: 30,
        }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>

        <Text style={{
          fontSize: scaleFont(24),
          fontWeight: 'bold',
          color: "#FFFFFF",
          marginBottom: 10,
          textAlign: 'center',
        }}>
          Fetching Device Logs
        </Text>

        <Text style={{
          fontSize: scaleFont(16),
          color: "#BBBBBB",
          textAlign: 'center',
          marginBottom: 20,
          lineHeight: 24,
        }}>
          Connecting to device and retrieving real-time logs ...
        </Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: "#1E1E1E", // dark surface
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderRadius: 12,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}>
          <Icon name="bluetooth" size={20} color="#4DA6FF" />
          <Text style={{
            fontSize: scaleFont(14),
            color: "#BBBBBB",
            marginLeft: 10,
          }}>
            Communicating with {device?.name || 'Device'}
          </Text>
        </View>

        <Text style={{
          fontSize: scaleFont(12),
          color: "#888888",
          textAlign: 'center',
          marginTop: 20,
          fontStyle: 'italic',
        }}>
          Please wait 5-10 seconds for data retrieval
        </Text>
      </View>
    </View>
  );

  // Show loading screen if fetching device data
  if (logsLoading) {
    return <DeviceLogsLoading />;
  }
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#121212', // dark background
      paddingTop: getHeaderHeight(),
    }}>
      <StatusBar
        backgroundColor="#000000"
        barStyle="light-content"
        translucent={true}
      />

      {/* Header */}
      <View style={{
        backgroundColor: '#1a1a1a', // dark header
        paddingHorizontal: 20,
        paddingVertical: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            flex: 1,
          }}>
            Live Logs
          </Text>
        </View>
      </View>

      {/* Device Info */}
      {device && (
        <View style={{
          backgroundColor: '#2a2a2a',
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#00bcd4',
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 8,
          }}>
            Connected Device
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#bbbbbb',
            marginBottom: 4,
          }}>
            Name: {device.name || 'Unknown'}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#888888',
            fontFamily: 'monospace',
          }}>
            ID: {device.id}
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={{
          backgroundColor: '#2a0000',
          marginHorizontal: 20,
          marginBottom: 20,
          padding: 16,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#f44336',
        }}>
          <Text style={{
            fontSize: 14,
            color: '#ff6b6b',
            fontWeight: 'bold',
            marginBottom: 4,
          }}>
            Error
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#ff6b6b',
          }}>
            {error}
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={{
        padding: 20,
        gap: 16,
      }}>
        {/* Fetch Logs Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#4caf50',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={addTestLog}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              name="plus"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              Fetch Logs
          </Text>
          </View>
        </TouchableOpacity>

        {/* Clear Logs Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#666666',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            alignItems: 'center',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={clearLogs}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              name="delete"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              Clear Logs
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logs Display */}
      <View style={{
        flex: 1,
        marginHorizontal: 20,
        marginBottom: 20,
      }}>
        <View style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          padding: 16,
          flex: 1,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 12,
          }}>
            Live Logs ({logs.length} entries)
          </Text>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {logs.length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 40,
              }}>
                <Icon
                  name="file-document-outline"
                  size={48}
                  color="#888888"
                />
                <Text style={{
                  fontSize: 16,
                  color: '#888888',
                  marginTop: 16,
                  textAlign: 'center',
                }}>
                  No logs available{'\n'}
                  Press "Add Test Log" to add sample logs
                </Text>
              </View>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={{
                  marginBottom: 10,
                  padding: 8,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 6
                }}>
                  {Object.entries(log).map(([key, value]) => (
                    <Text key={key} style={{ fontSize: 14, color: '#eeeeee' }}>
                      {key}: {String(value)}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Floating Action Button for Export */}
      {logs.length > 0 && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 30,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#673ab7',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
          onPress={exportLogsToExcel}
        >
          <Icon name="download" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>

  );
}

function FullScreenLogsScreen({ navigation, route }: { navigation: any; route: any }) {
  const theme = useTheme();
  const { logs } = route.params || [];
  const [searchText, setSearchText] = useState('');
  const [filteredLogs, setFilteredLogs] = useState(logs || []);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredLogs(logs || []);
    } else {
      const filtered = (logs || []).filter(log =>
        log.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [searchText, logs]);

  const exportLogs = () => {
    try {
      const logText = logs.join('\n\n');
      // For now, we'll just show an alert with the option to copy
      console.log('Export Logs: Logs copied to clipboard. You can paste them in any text editor.');
      // In a real implementation, you might want to use a library like react-native-share
      // to save the file or share it
    } catch (error) {
      console.log('Error: Failed to export logs');
    }
  };

  const clearAllLogs = () => {
    console.log('Clear All Logs: Are you sure you want to clear all logs? This action cannot be undone.');
    // This would need to be handled by the parent component
    // For now, we'll just go back
    navigation.goBack();
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.isDark ? '#000000' : '#ffffff',
    }}>
      <StatusBar
        backgroundColor={theme.isDark ? '#000000' : '#ffffff'}
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        translucent={false}
      />

      {/* Full Screen Logs Display */}
      <View style={{ flex: 1 }}>
        {filteredLogs.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 40,
          }}>
            <Icon
              name="file-document-outline"
              size={64}
              color={theme.textSecondary}
            />
            <Text style={{
              fontSize: 18,
              color: theme.textSecondary,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {searchText ? 'No logs match your search' : 'No logs available'}
            </Text>
            {searchText && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={{
                  marginTop: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: theme.info,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Clear Search
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ padding: 8 }}
          >
            {filteredLogs.map((log, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: theme.isDark ? '#1a1a1a' : '#f8f9fa',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: '#673ab7',
                }}
              >
                <Text style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  fontFamily: 'monospace',
                  lineHeight: 18,
                }}>
                  {log}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Floating Controls */}
      <View style={{
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="magnify" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={exportLogs}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="download" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={clearAllLogs}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255,0,0,0.8)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Floating Search Bar */}
      {showSearch && (
        <View style={{
          position: 'absolute',
          top: 80,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: 12,
          padding: 12,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            paddingHorizontal: 12,
          }}>
            <Icon name="magnify" size={20} color="#fff" />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 12,
                fontSize: 16,
                color: '#fff',
              }}
              placeholder="Search logs..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Log Count Indicator */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
      }}>
        <Text style={{
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
        }}>
          {filteredLogs.length} logs
        </Text>
      </View>
    </View>
  );
}

function RawLogsView({ navigation, route }: { navigation: any; route: any }) {
  const theme = useTheme();
  const { logs } = route.params || [];

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.isDark ? '#000000' : '#ffffff',
    }}>
      <StatusBar
        backgroundColor={theme.isDark ? '#000000' : '#607d8b'}
        barStyle={theme.isDark ? "light-content" : "light-content"}
        translucent={false}
      />

      {/* Header */}
      <View style={{
        backgroundColor: theme.isDark ? '#1a1a1a' : '#607d8b',
        paddingHorizontal: 20,
        paddingVertical: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            flex: 1,
          }}>
            Raw Logs ({logs.length})
          </Text>
        </View>
      </View>

      {/* Raw Logs Display */}
      <View style={{ flex: 1 }}>
        {logs.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 40,
          }}>
            <Icon
              name="code-braces"
              size={64}
              color={theme.textSecondary}
            />
            <Text style={{
              fontSize: 18,
              color: theme.textSecondary,
              marginTop: 16,
              textAlign: 'center',
            }}>
              No raw logs available
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ padding: 16 }}
          >
            {logs.map((log, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: theme.isDark ? '#1a1a1a' : '#f8f9fa',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: '#607d8b',
                }}
              >
                <Text style={{
                  fontSize: 12,
                  color: theme.textSecondary,
                  fontFamily: 'monospace',
                  lineHeight: 16,
                }}>
                  {log}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function SplashScreen({ navigation }: { navigation: any }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [loadingAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate logo appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate loading dots
    const loadingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loadingAnimation.start();

    return () => {
      loadingAnimation.stop();
    };
  }, []);

  // Simple timeout to navigate after splash
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Scanner');
    }, 3000); // 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <StatusBar
        backgroundColor="#000000"
        barStyle="light-content"
        translucent={true}
      />

      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
      }}>
        {/* Logo Image */}
        <Image
          source={require('./src/assets/SWN_CHIEF_LOGO_FINAL.png')}
          style={{
            width: 300,
            height: 200,
            resizeMode: 'contain',
          }}
        />

        {/* Loading indicator */}
        <View style={{
          alignItems: 'center',
          marginTop: 40,
        }}>
          {/* Animated Loading Dots */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Animated.View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#00BCD4',
              marginRight: 8,
              opacity: loadingAnim,
              transform: [{
                scale: loadingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                })
              }]
            }} />
            <Animated.View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#4CAF50',
              marginRight: 8,
              opacity: loadingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
              transform: [{
                scale: loadingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                })
              }]
            }} />
            <Animated.View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#666666',
              opacity: loadingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [{
                scale: loadingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                })
              }]
            }} />
          </View>

          {/* Loading Text */}
          <Text style={{
            color: '#666666',
            fontSize: 14,
            marginTop: 16,
            fontWeight: '500',
          }}>
            Loading...
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimerProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
              transitionSpec: {
                open: {
                  animation: 'timing',
                  config: {
                    duration: 300,
                    easing: Easing.out(Easing.poly(4)),
                  },
                },
                close: {
                  animation: 'timing',
                  config: {
                    duration: 300,
                    easing: Easing.in(Easing.poly(4)),
                  },
                },
              },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="DeviceDashboard" component={DeviceDashboardView} />
            <Stack.Screen name="DeviceDetails" component={DeviceDetailsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="SensorCalibration" component={SensorCalibrationScreen} />
            <Stack.Screen name="LiveLogs" component={LiveLogsScreen} />
            <Stack.Screen name="Terminal" component={Terminal} />
            <Stack.Screen name="FullScreenLogs" component={FullScreenLogsScreen} />
            <Stack.Screen name="RawLogsView" component={RawLogsView} />
          </Stack.Navigator>
        </NavigationContainer>
      </TimerProvider>
    </ThemeProvider>
  );
}



const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00bcd4',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topBarTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    marginLeft: 16,
    flex: 1,
    textAlign: 'center'
  },
  scanBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 20
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0097a7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  deviceCardRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    marginVertical: getSpacing(8),
    marginHorizontal: getSpacing(4),
    padding: getCardPadding(),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rssiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    elevation: 2,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2
  },
  deviceId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  deviceMeta: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  connectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 2,
    minWidth: 100,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  rawDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
  },
  rawData: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 4
  },
  log: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontStyle: 'italic'
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
});
