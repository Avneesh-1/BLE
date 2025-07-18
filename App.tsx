/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, PermissionsAndroid, Platform, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const manager = new BleManager();
const BottomTab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();
const Stack = createStackNavigator();

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    ]);
    console.log('Permission results:', result);
    Alert.alert('Permissions', JSON.stringify(result, null, 2));
  }
}

function DeviceCard({ device, onConnect, onDisconnect, onPress, onDashboardPress }) {
  const [connecting, setConnecting] = useState(false);
  
  // Calculate color and text for RSSI
  let rssiColor = '#888';
  let rssiBg = '#ccc';
  if (device.rssi >= -60) { rssiColor = '#fff'; rssiBg = '#4caf50'; }
  else if (device.rssi >= -80) { rssiColor = '#fff'; rssiBg = '#8bc34a'; }
  else if (device.rssi < -80) { rssiColor = '#fff'; rssiBg = '#9c27b0'; }

  // Approximate distance (very rough, for demo)
  let distance = device.rssi ? Math.abs((27.55 - (20 * Math.log10(2400)) + Math.abs(device.rssi)) / 
  20.0) : 0;

  distance = distance.toFixed(2);

  // Use device's connectability status
  const isConnectable = device.isConnectable || false;
  const isConnected = device.isConnected || false;

  const handleConnectDisconnect = async () => {
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
  };

  return (
    <TouchableOpacity 
      onPress={() => isConnected ? onDashboardPress(device) : null} 
      activeOpacity={isConnected ? 0.7 : 1} 
      style={{ flex: 1, opacity: isConnected ? 1 : 0.6 }}
    >
      <View style={[styles.deviceCardRow, { opacity: isConnected ? 1 : 0.8 }]}>
        <View style={[styles.rssiCircle, { backgroundColor: rssiBg }]}> 
          <Text style={{ color: rssiColor, fontWeight: 'bold', fontSize: 16 }}>{device.rssi || '--'}</Text>
          <Text style={{ color: rssiColor, fontSize: 10 }}>dBm</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.deviceName}>{device.name || 'N/A'}</Text>
          <Text style={styles.deviceId}>{device.id}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Icon name="cellphone" size={14} color="#666" />
            <Text style={styles.deviceMeta}>  Distance: {distance} m</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Icon name="wifi" size={14} color="#666" />
            <Text style={styles.deviceMeta}>  Signal: {device.rssi || '--'} dBm</Text>
          </View>
          {!isConnected && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Icon name="lock" size={12} color="#ff9800" />
              <Text style={{ fontSize: 11, color: '#ff9800', marginLeft: 4, fontStyle: 'italic' }}>
                Connect to access dashboard
              </Text>
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 80 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={[styles.infoBtn, { 
                backgroundColor: '#2196F3',
                opacity: 1
              }]}
              onPress={() => onPress(device)}
            >
              <Icon name="information" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.connectBtn, { 
                backgroundColor: connecting ? '#ff9800' : (isConnected ? '#f44336' : (isConnectable ? '#4CAF50' : '#e0e0e0')),
                opacity: connecting ? 0.8 : 1
              }]}
              disabled={!isConnectable || connecting}
              onPress={handleConnectDisconnect}
            >
              <Text style={{ 
                color: connecting ? '#fff' : (isConnected ? '#fff' : (isConnectable ? '#fff' : '#999')), 
                fontWeight: 'bold',
                fontSize: 12
              }}>
                {connecting ? 'CONNECTING...' : (isConnected ? 'DISCONNECT' : (isConnectable ? 'CONNECT' : 'Not Available'))}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity style={styles.rawDataBtn}>
              <Icon name="chart-line" size={16} color="#2196F3" />
              <Text style={styles.rawData}>DATA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ScannerScreen({ navigation }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState('');

  useEffect(() => {
    requestPermissions();
    return () => {
      // Stop any active scanning when component unmounts
      manager.stopDeviceScan();
    };
  }, []);

  const scanForDevices = () => {
    setDevices([]);
    setScanning(true);
    setLog('Starting scan...');
    
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
    setLog('Connecting to ' + (device.name || device.id));
    try {
      // Connect to device
      const connectedDevice = await manager.connectToDevice(device.id);
      setLog('Connected to ' + (device.name || device.id));
      
      // Update device list to show connected status
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, isConnected: true, connectedDevice: connectedDevice }
          : d
      ));
      
      setLog('Connection complete! Device is now connected.');
      Alert.alert('Success', 'Device connected successfully!');
    } catch (e: any) {
      setLog('Connection error: ' + e.message);
      Alert.alert('Connection Failed', 'Failed to connect to device: ' + e.message);
    }
  };

  const disconnectFromDevice = async (device: any) => {
    setLog('Disconnecting from ' + (device.name || device.id));
    try {
      if (device.connectedDevice) {
        await manager.cancelDeviceConnection(device.connectedDevice.id);
      }
      
      // Update device list to show disconnected status
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, isConnected: false, connectedDevice: null }
          : d
      ));
      
      setLog('Disconnection complete! Device is now disconnected.');
      Alert.alert('Success', 'Device disconnected successfully!');
    } catch (e: any) {
      setLog('Disconnection error: ' + e.message);
      Alert.alert('Disconnection Failed', 'Failed to disconnect from device: ' + e.message);
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
            onPress: () => connectToDevice(device)
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>BLE Scanner</Text>
      </View>
      <View style={styles.scanBtnRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={scanForDevices} disabled={scanning}>
          <Icon name="bluetooth" size={22} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 8, fontSize: 16, fontWeight: '600' }}>
            {scanning ? 'Scanning...' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
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
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
              <Icon name="bluetooth-off" size={80} color="#ccc" />
              <Text style={{ fontSize: 18, color: '#888', marginTop: 16, textAlign: 'center' }}>
                No devices found
              </Text>
              <Text style={{ fontSize: 14, color: '#aaa', marginTop: 8, textAlign: 'center' }}>
                Tap "Scan for Devices" to discover nearby BLE devices
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      {log && (
        <View style={{ 
          backgroundColor: '#e3f2fd', 
          marginHorizontal: 16, 
          marginBottom: 16, 
          padding: 12, 
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: '#2196F3'
        }}>
          <Text style={styles.log}>{log}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function DeviceDashboardView({ route, navigation }) {
  const { device } = route.params;
  const [batteryLevel, setBatteryLevel] = useState(75); // Default battery level for demo
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [serverSiteName, setServerSiteName] = useState('Site-001');
  const [selectedSim, setSelectedSim] = useState('Jio');
  const [selectedSensor, setSelectedSensor] = useState('Chlorine level');
  const [sensorStates, setSensorStates] = useState({
    'Chlorine level': true,
    'pH level': false,
    'Turbidity': false,
    'Pressure': false,
    'Load': false,
    'TDS': false,
    'Flow rate': false,
    'Water Temp': false,
    'Air Temp': false,
    'Ultrasonic flow sensor': false,
  });

  // Battery indicator component
  const BatteryIndicator = ({ level }: { level: number }) => {
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
          {level}%
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#00bcd4', 
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, marginLeft: 16, flex: 1 }}>Device Dashboard</Text>
        <TouchableOpacity 
          onPress={() => setShowSettingsDrawer(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 4, height: 4, backgroundColor: '#fff', borderRadius: 2, marginBottom: 2 }} />
            <View style={{ width: 4, height: 4, backgroundColor: '#fff', borderRadius: 2, marginBottom: 2 }} />
            <View style={{ width: 4, height: 4, backgroundColor: '#fff', borderRadius: 2 }} />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}>
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => setShowSettingsDrawer(false)}
          />
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '70%',
            height: '100%',
            backgroundColor: '#fff',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}>
            {/* Drawer Header */}
            <View style={{
              backgroundColor: '#00bcd4',
              paddingTop: 50,
              paddingBottom: 20,
              paddingHorizontal: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Menu</Text>
                <TouchableOpacity 
                  onPress={() => setShowSettingsDrawer(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Drawer Content - Vertical Column */}
            <View style={{ flex: 1, padding: 20 }}>
              {/* Logs Option */}
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 16, 
                  borderBottomWidth: 1, 
                  borderBottomColor: '#f0f0f0',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 8,
                  marginBottom: 12,
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  Alert.alert('Logs', 'Logs menu opened!');
                }}
              >
                <Icon name="file-document" size={24} color="#2196F3" />
                <Text style={{ fontSize: 18, color: '#333', marginLeft: 16, flex: 1, fontWeight: '500' }}>
                  Logs
                </Text>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>

              {/* Sensor Calibration Option */}
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 16, 
                  borderBottomWidth: 1, 
                  borderBottomColor: '#f0f0f0',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 8,
                  marginBottom: 12,
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  Alert.alert('Sensor Calibration', 'Sensor Calibration menu opened!');
                }}
              >
                <Icon name="tune" size={24} color="#4CAF50" />
                <Text style={{ fontSize: 18, color: '#333', marginLeft: 16, flex: 1, fontWeight: '500' }}>
                  Sensor Calibration
                </Text>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>

              {/* Settings Option */}
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 16, 
                  borderBottomWidth: 1, 
                  borderBottomColor: '#f0f0f0',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 8,
                  marginBottom: 12,
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setShowSettingsDrawer(false);
                  navigation.navigate('Settings', { 
                    serverSiteName, 
                    setServerSiteName,
                    selectedSim,
                    setSelectedSim,
                    selectedSensor,
                    setSelectedSensor,
                    sensorStates,
                    setSensorStates
                  });
                }}
              >
                <Icon name="cog" size={24} color="#FF9800" />
                <Text style={{ fontSize: 18, color: '#333', marginLeft: 16, flex: 1, fontWeight: '500' }}>
                  Settings
                </Text>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Top Row - Battery and Device Name */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          {/* Phone Battery Indicator - Top Left Corner */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.95)',
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 4,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            borderWidth: 1,
            borderColor: batteryLevel < 30 ? '#f44336' : '#4CAF50',
          }}>
            <View style={{
              width: 12,
              height: 8,
              backgroundColor: batteryLevel < 30 ? '#f44336' : '#4CAF50',
              borderRadius: 1,
              marginRight: 4,
            }} />
            <Text style={{ 
              fontSize: 10, 
              fontWeight: 'bold', 
              color: batteryLevel < 30 ? '#f44336' : '#4CAF50',
            }}>
              {batteryLevel}%
            </Text>
          </View>

          {/* Device Name - Top Middle */}
          <View style={{
            backgroundColor: '#fff',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            borderWidth: 1,
            borderColor: '#e0e0e0',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
            }}>
              {device.name || 'Unknown Device'} - BLE
            </Text>
          </View>

          {/* Empty space for balance */}
          <View style={{ width: 40 }} />
        </View>

        {/* Main Dashboard Content - 4 Sections */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: 20,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          marginBottom: 20,
        }}>
          
          {/* Section 1: Device Information */}
          <View style={{
            backgroundColor: '#e3f2fd',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#2196F3',
            flex: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="information" size={20} color="#2196F3" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1976D2', marginLeft: 8 }}>
                Device Information
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Server Site Name:</Text> {serverSiteName}
              </Text>
              <Text style={{ fontSize: 14, color: '#333' }}>
                <Text style={{ fontWeight: 'bold' }}>Firmware Version:</Text> v2.1.4
              </Text>
            </View>
          </View>

          {/* Section 2: Network and Power */}
          <View style={{
            backgroundColor: '#f3e5f5',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#9C27B0',
            flex: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="wifi" size={20} color="#9C27B0" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#7B1FA2', marginLeft: 8 }}>
                Network & Power
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              {/* SIM Card Display */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  SIM Card Selected:
                </Text>
                <View style={{
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#9C27B0',
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  minWidth: 80,
                }}>
                  <Text style={{ fontSize: 14, color: '#9C27B0', fontWeight: 'bold' }}>
                    {selectedSim}
                  </Text>
                </View>
              </View>
              
              <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Date & Time:</Text> 15/12/2024 14:30
              </Text>
              
              {/* GSM Signal with Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  GSM Signal Strength:
                </Text>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#4CAF50',
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: 'bold' }}>
                  ON
                </Text>
                <Text style={{ fontSize: 14, color: '#333', marginLeft: 8 }}>
                  -65 dBm
                </Text>
              </View>
              
              {/* Solar Charging with Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  Solar Charging:
                </Text>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#4CAF50',
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: 'bold' }}>
                  ON
                </Text>
              </View>
            </View>
          </View>

          {/* Section 3: Live Sensor Data */}
          <View style={{
            backgroundColor: '#e8f5e8',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#4CAF50',
            flex: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="chart-line" size={20} color="#4CAF50" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginLeft: 8 }}>
                Live Sensor Data
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              {/* 9 Sensor Data */}
              <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>9 SENSOR DATA:</Text> Active
              </Text>
              
              {/* Sensor Communication */}
              <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Sensor Communication:</Text> Active
              </Text>
              
              {/* Enabled Sensors */}
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 8 }}>
                Enabled Sensors:
              </Text>
              {Object.entries(sensorStates)
                .filter(([sensorName, isEnabled]) => isEnabled)
                .map(([sensorName, isEnabled]) => (
                  <View key={sensorName} style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: 4,
                  }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#4CAF50',
                      marginRight: 8,
                    }} />
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#4CAF50',
                      fontWeight: 'bold'
                    }}>
                      {sensorName}: ACTIVE
                    </Text>
                  </View>
                ))}
              {Object.entries(sensorStates).filter(([sensorName, isEnabled]) => isEnabled).length === 0 && (
                <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                  No sensors enabled
                </Text>
              )}
            </View>
          </View>

          {/* Section 4: Communication */}
          <View style={{
            backgroundColor: '#fff3e0',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 0,
            flex: 1,
            borderLeftColor: '#FF9800',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="message-text" size={20} color="#FF9800" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#E65100', marginLeft: 8 }}>
                Communication
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              {/* GSM Post Status with Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  GSM Post Status:
                </Text>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#4CAF50',
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: 'bold' }}>
                  ON
                </Text>
              </View>
              
              {/* RS485-1 Status with Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  RS485-1 Status:
                </Text>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#4CAF50',
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: 'bold' }}>
                  ON
                </Text>
              </View>
              
              {/* RS485-2 Status with Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  RS485-2 Status:
                </Text>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#f44336',
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: '#f44336', fontWeight: 'bold' }}>
                  OFF
                </Text>
              </View>
              
              {/* GPIO Extender Status with Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginRight: 8 }}>
                  GPIO Extender Status:
                </Text>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#4CAF50',
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: 'bold' }}>
                  ON
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsScreen({ navigation, route }) {
  const { 
    serverSiteName: initialServerSiteName, 
    setServerSiteName,
    selectedSim: initialSelectedSim,
    setSelectedSim: setParentSelectedSim,
    selectedSensor: initialSelectedSensor,
    setSelectedSensor: setParentSelectedSensor,
    sensorStates: initialSensorStates,
    setSensorStates: setParentSensorStates
  } = route.params || {};
  const [serverSiteName, setLocalServerSiteName] = useState(initialServerSiteName || 'Site-001');
  const [selectedSim, setLocalSelectedSim] = useState(initialSelectedSim || 'Jio');
  const [selectedSensor, setLocalSelectedSensor] = useState(initialSelectedSensor || 'Chlorine level');
  const [sensorStates, setLocalSensorStates] = useState(initialSensorStates || {
    'Chlorine level': true,
    'pH level': false,
    'Turbidity': false,
    'Pressure': false,
    'Load': false,
    'TDS': false,
    'Flow rate': false,
    'Water Temp': false,
    'Air Temp': false,
    'Ultrasonic flow sensor': false,
  });
  const [showSimDropdown, setShowSimDropdown] = useState(false);
  const [showSensorDropdown, setShowSensorDropdown] = useState(false);

  // Update the parent component when server site name changes
  const handleServerSiteNameChange = (newName) => {
    setLocalServerSiteName(newName);
    if (setServerSiteName) {
      setServerSiteName(newName);
    }
  };

  // Update the parent component when SIM selection changes
  const handleSimSelectionChange = (newSim) => {
    setLocalSelectedSim(newSim);
    if (setParentSelectedSim) {
      setParentSelectedSim(newSim);
    }
  };

  // Update the parent component when sensor selection changes
  const handleSensorSelectionChange = (newSensor) => {
    setLocalSelectedSensor(newSensor);
    if (setParentSelectedSensor) {
      setParentSelectedSensor(newSensor);
    }
  };

  // Update the parent component when sensor states change
  const handleSensorStateChange = (sensorName, isEnabled) => {
    const newSensorStates = { ...sensorStates, [sensorName]: isEnabled };
    setLocalSensorStates(newSensorStates);
    if (setParentSensorStates) {
      setParentSensorStates(newSensorStates);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#00bcd4', 
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, marginLeft: 16, flex: 1 }}>Settings</Text>
      </View>
      
      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: 20,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          marginBottom: 20,
        }}>
          
          {/* Server Site Name */}
          <View style={{
            backgroundColor: '#e3f2fd',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#2196F3',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Icon name="server" size={20} color="#2196F3" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1976D2', marginLeft: 8 }}>
                Server Configuration
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 8 }}>
                Server Site Name:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#2196F3',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: '#333',
                  backgroundColor: '#fff',
                }}
                value={serverSiteName}
                onChangeText={handleServerSiteNameChange}
                placeholder="Enter server site name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* SIM Card Selection */}
          <View style={{
            backgroundColor: '#f3e5f5',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#9C27B0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Icon name="sim" size={20} color="#9C27B0" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#7B1FA2', marginLeft: 8 }}>
                SIM Card Selection
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 8 }}>
                Select SIM Card:
              </Text>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#9C27B0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 120,
                  }}
                  onPress={() => setShowSimDropdown(!showSimDropdown)}
                >
                  <Text style={{ fontSize: 14, color: '#9C27B0', fontWeight: 'bold' }}>
                    {selectedSim}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9C27B0', marginLeft: 4 }}>
                    {showSimDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {showSimDropdown && (
                  <View style={{
                    position: 'absolute',
                    top: 40,
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#9C27B0',
                    borderRadius: 8,
                    zIndex: 1000,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f0f0f0',
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
                        paddingVertical: 8,
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
            </View>
          </View>

          {/* Sensor Management */}
          <View style={{
            backgroundColor: '#e8f5e8',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 24,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#4CAF50',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Icon name="tune" size={20} color="#4CAF50" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginLeft: 8 }}>
                Sensor Management
              </Text>
            </View>
            <View style={{ marginLeft: 28 }}>
              <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 8 }}>
                Select Sensors to Enable/Disable:
              </Text>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#4CAF50',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 200,
                  }}
                  onPress={() => setShowSensorDropdown(!showSensorDropdown)}
                >
                  <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: 'bold' }}>
                    {Object.values(sensorStates).filter(Boolean).length} sensors enabled
                  </Text>
                  <Text style={{ fontSize: 12, color: '#4CAF50', marginLeft: 4 }}>
                    {showSensorDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {showSensorDropdown && (
                  <View style={{
                    position: 'absolute',
                    top: 40,
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#4CAF50',
                    borderRadius: 8,
                    zIndex: 1000,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    maxHeight: 300,
                  }}>
                    {Object.entries(sensorStates).map(([sensorName, isEnabled], index) => (
                      <TouchableOpacity
                        key={sensorName}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: index < Object.keys(sensorStates).length - 1 ? 1 : 0,
                          borderBottomColor: '#f0f0f0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isEnabled ? '#f0f8f0' : '#fff',
                        }}
                        onPress={() => handleSensorStateChange(sensorName, !isEnabled)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: isEnabled ? '#4CAF50' : '#ccc',
                            marginRight: 10,
                          }} />
                          <Text style={{ 
                            fontSize: 14, 
                            color: isEnabled ? '#4CAF50' : '#333',
                            fontWeight: isEnabled ? 'bold' : 'normal',
                            flex: 1,
                          }}>
                            {sensorName}
                          </Text>
                        </View>
                        <Text style={{ 
                          fontSize: 12, 
                          color: isEnabled ? '#4CAF50' : '#666',
                          fontWeight: 'bold',
                        }}>
                          {isEnabled ? 'ENABLED' : 'DISABLED'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>


        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceDetailsScreen({ route, navigation }) {
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
        const charsWithValue = await Promise.all(chars.map(async (char) => {
          let value = null;
          if (char.isReadable) {
            try {
              const readChar = await connectedDevice.readCharacteristicForService(svc.uuid, char.uuid);
              value = Buffer.from(readChar.value, 'base64').toString('utf8');
            } catch (e) {
              value = '[Read error]';
            }
          }
          return { ...char, value, serviceUUID: svc.uuid };
        }));
        charsByService[svc.uuid] = charsWithValue;
      }
      setCharacteristics(charsByService);
      setLoadingServices(false);
    } catch (e) {
      setStatus('Disconnected');
      setLoadingServices(false);
      Alert.alert('Connection error', e.message);
    }
    setConnecting(false);
  };

  const handleWrite = async (serviceUUID, charUUID) => {
    setWriting(true);
    try {
      const base64Value = Buffer.from(writeValue, 'utf8').toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(serviceUUID, charUUID, base64Value);
      Alert.alert('Success', 'Value written to device!');
      setWriteValue('');
    } catch (e) {
      Alert.alert('Write error', e.message);
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
        Alert.alert('Success', 'Notifications disabled');
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
        Alert.alert('Success', 'Notifications enabled');
      }
    } catch (e) {
      Alert.alert('Notify error', e.message);
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
      
      Alert.alert('Read Success', `Value: ${newValue}`);
    } catch (e) {
      Alert.alert('Read error', e.message);
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
        Alert.alert('Success', 'Device disconnected');
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
      Alert.alert('Disconnect error', e.message);
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

function HistoryScreen() {
  return <View style={styles.placeholder}><Text>History (placeholder)</Text></View>;
}
function FavoritesScreen() {
  return <View style={styles.placeholder}><Text>Favorites (placeholder)</Text></View>;
}

function ScannerTabs() {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 16 },
        tabBarIndicatorStyle: { backgroundColor: '#0097a7', height: 4, borderRadius: 2 },
        tabBarStyle: { backgroundColor: '#e0f7fa' },
        tabBarActiveTintColor: '#0097a7',
        tabBarInactiveTintColor: '#333',
      }}
    >
      <TopTab.Screen name="Near By" component={ScannerScreen} />
      <TopTab.Screen name="History" component={HistoryScreen} />
      <TopTab.Screen name="Favorites" component={FavoritesScreen} />
    </TopTab.Navigator>
  );
}

function IBeaconScannerScreen() {
  return <View style={styles.placeholder}><Text>iBeacon Scanner (placeholder)</Text></View>;
}
function AdvertiserScreen() {
  return <View style={styles.placeholder}><Text>Advertiser (placeholder)</Text></View>;
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="DeviceDashboard" component={DeviceDashboardView} />
        <Stack.Screen name="DeviceDetails" component={DeviceDetailsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Scanner') return <Icon name="bluetooth" color={color} size={size} />;
          return null;
        },
        tabBarActiveTintColor: '#0097a7',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#e0f7fa', borderTopWidth: 0 },
        headerShown: false,
      })}
    >
      <BottomTab.Screen name="Scanner" component={ScannerTabs} />
    </BottomTab.Navigator>
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
    borderRadius: 16, 
    marginVertical: 8, 
    marginHorizontal: 4, 
    padding: 16, 
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
