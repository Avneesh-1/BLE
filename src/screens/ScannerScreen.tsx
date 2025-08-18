import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar, 
  Platform, 
  Image 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { DeviceCard } from '../components/DeviceCard';
import { getBLEManager, getBLEState } from '../services/BLEService';
import { scale, scaleFont } from '../utils/responsive';

interface ScannerScreenProps {
  navigation: any;
}

export function ScannerScreen({ navigation }: ScannerScreenProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    requestPermissions();
    return () => {
      // Stop any active scanning when component unmounts
      const manager = getBLEManager();
      if (manager) {
        manager.stopDeviceScan();
      }
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);
      console.log('Permission results:', result);
    }
  };

  const scanForDevices = () => {
    const manager = getBLEManager();
    if (!manager) {
      setLog('BLE Manager not initialized');
      return;
    }
    
    setDevices([]);
    setScanning(true);
    setLog('Starting scan...');
    
    // Check if BLE is available
    manager.state().then((state) => {
      console.log('BLE State before scan:', state);
      if (state !== 'PoweredOn') {
        setLog('Bluetooth is not available. State: ' + state);
        setScanning(false);
        return;
      }
    }).catch((error) => {
      console.error('Error checking BLE state:', error);
      setLog('Error checking Bluetooth state: ' + error.message);
      setScanning(false);
      return;
    });
    
    try {
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setLog('Scan error: ' + error.message);
          setScanning(false);
          return;
        }
        if (device && device.id) {
          console.log('Found device:', device.name || device.id);
          
          setDevices(prev => {
            if (prev.some(d => d.id === device.id)) return prev;
            // Add device with default disconnected state and connectability check
            const newDevice = {
              ...device,
              isConnected: false,
              connectedDevice: null,
              isConnectable: device.name && 
                             device.name !== 'N/A' && 
                             device.name.length > 0 && 
                             device.name !== 'Unknown' &&
                             device.name !== 'null'
            };
            return [...prev, newDevice];
          });
        }
      });
      
      setTimeout(() => {
        manager.stopDeviceScan();
        setScanning(false);
        setLog('Scan completed. Found ' + devices.length + ' devices.');
      }, 5000);
    } catch (e: any) {
      console.error('Scan start error:', e);
      setLog('Failed to start scan: ' + (e instanceof Error ? e.message : String(e)));
      setScanning(false);
    }
  };

  const connectToDevice = async (device: any) => {
    const manager = getBLEManager();
    if (!manager) return;

    setLog('Connecting to ' + (device.name || device.id));
    
    try {
      // Cancel any existing connection first
      try {
        await manager.cancelDeviceConnection(device.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        // Ignore cancel errors
      }
      
      // Connect with proper timeout
      const connectedDevice = await manager.connectToDevice(device.id, { timeout: 10000 });
      
      setLog('Connected to ' + (device.name || device.id));
      
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, isConnected: true, connectedDevice: connectedDevice }
          : d
      ));
    } catch (error: any) {
      console.error('Connection error:', error);
      setLog('Connection failed: ' + error.message);
      
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, isConnected: false, connectedDevice: null }
          : d
      ));
    }
  };

  const disconnectFromDevice = async (device: any) => {
    const manager = getBLEManager();
    if (!manager) return;

    setLog('Disconnecting from ' + (device.name || device.id));
    
    try {
      await manager.cancelDeviceConnection(device.id);
      
      setLog('Disconnected from ' + (device.name || device.id));
      
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, isConnected: false, connectedDevice: null }
          : d
      ));
    } catch (error: any) {
      console.error('Disconnection error:', error);
      setLog('Disconnection failed: ' + error.message);
    }
  };

  const handleDevicePress = (device: any) => {
    navigation.navigate('DeviceDetails', { device });
  };

  const handleDashboardPress = (device: any) => {
    if (device.isConnected) {
      navigation.navigate('DeviceDashboard', { device });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar 
        backgroundColor={theme.statusBarBg} 
        barStyle={theme.statusBar} 
        translucent={true}
      />
      
      {/* Enhanced Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: theme.background, 
        padding: scale(16),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
      }}>
        {/* Centered Logo */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image 
            source={require('../assets/SWN_CHIEF_LOGO_FINAL.png')}
            style={{
              width: 140,
              height: 80,
              resizeMode: 'contain',
            }}
          />
          <Text style={{ color: theme.textSecondary, fontSize: scaleFont(16), marginTop: 8, textAlign: 'center' }}>
            BLE Device Scanner
          </Text>
        </View>
      </View>

      {/* Enhanced Scan Control Section */}
      <View style={{
        backgroundColor: theme.surface,
        margin: 16,
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: scanning ? theme.warning : theme.success,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <Icon 
              name={scanning ? "wifi" : "bluetooth"} 
              size={18} 
              color={theme.text} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
              {scanning ? 'Scanning...' : 'Device Discovery'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
              {scanning ? 'Searching for nearby BLE devices' : 'Tap to start scanning for devices'}
            </Text>
          </View>
        </View>

        {/* Enhanced Scan Button */}
        <TouchableOpacity 
          style={{
            backgroundColor: scanning ? theme.warning : theme.primary,
            borderRadius: 12,
            paddingVertical: 16,
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

        {/* Scan Status Indicator */}
        {scanning && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
            paddingVertical: 12,
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
      </View>

      {/* Enhanced Device List */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
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
              {devices.length} found
            </Text>
          </View>
        </View>

        <FlatList
          data={devices}
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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>

      {/* Enhanced Log Display */}
      {log && (
        <View style={{ 
          backgroundColor: theme.isDark ? '#1a1a1a' : '#e3f2fd', 
          marginHorizontal: 16, 
          marginBottom: 16, 
          padding: 16, 
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: theme.info,
          elevation: 2,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Icon name="information" size={16} color={theme.info} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: theme.info, fontWeight: '600' }}>
              Status Log
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{log}</Text>
        </View>
      )}
    </View>
  );
}



