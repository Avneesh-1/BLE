import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar, 
  Platform, 
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useTimer } from '../contexts/TimerContext';
import { scale, scaleFont } from '../utils/responsive';

interface DeviceDashboardScreenProps {
  route: any;
  navigation: any;
}

export function DeviceDashboardScreen({ route, navigation }: DeviceDashboardScreenProps) {
  const { device } = route.params;
  const { currentTime } = useTimer();
  const { theme } = useTheme();
  
  // Device Status State Variables
  const [isLoadingDeviceData, setIsLoadingDeviceData] = useState(true);
  const [deviceStatusData, setDeviceStatusData] = useState({
    batteryLevel: 75,
    gsmSignal: 'inactive',
    gsmSignalStrength: 0,
    gsmPostStatus: 'off',
    deviceDate: new Date().toLocaleDateString(),
    deviceTime: new Date().toLocaleTimeString(),
    solarLevel: 0,
    logCount: 0,
    latitude: 'N/A',
    longitude: 'N/A',
    IMEI_num: '',
    IMEI: '',
    imei: '',
    imei_num: '',
    imei_number: ''
  });

  const [deviceConfigData, setDeviceConfigData] = useState<any>({});
  const [deviceServerSiteName, setDeviceServerSiteName] = useState('');
  const [logsIMEI, setLogsIMEI] = useState('');
  const [sensorConfigData, setSensorConfigData] = useState<any>({});
  const [rawSensorData, setRawSensorData] = useState<string>('');
  
  // Refresh State
  const [showRefreshPopup, setShowRefreshPopup] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState('');
  
  // Settings State
  const [serverSiteName, setServerSiteName] = useState('Site-001');
  const [selectedSim, setSelectedSim] = useState('Jio');
  const [selectedSensor, setSelectedSensor] = useState('Chlorine level');
  const [selectedDateFormat, setSelectedDateFormat] = useState('DD/MM/YYYY HH:mm:ss');
  
  // Auto-fetch state
  const [autoFetchCompleted, setAutoFetchCompleted] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Fetch device data on component mount - ONLY ONCE
  useEffect(() => {
    const fetchDeviceData = async () => {
      if (device && !autoFetchCompleted) {
        console.log('=== DEVICE CONNECTED - STARTING SINGLE AUTO FETCH ===');
        setLastFetchTime(new Date());
        setAutoFetchCompleted(true);
        console.log('✅ Initial auto-fetch completed');
      }
    };
    
    fetchDeviceData();
  }, [device, autoFetchCompleted]);

  // Comprehensive refresh function
  const refreshAllDeviceData = async (showPopup: boolean = true) => {
    if (!device) {
      console.log('No device available for refresh');
      return;
    }
    
    console.log('=== STARTING COMPREHENSIVE DEVICE REFRESH ===');
    
    if (showPopup) {
      setShowRefreshPopup(true);
      setRefreshProgress(0);
      setRefreshStatus('Initializing connection...');
    }
    
    try {
      // Simulate refresh process
      setRefreshStatus('Fetching device status...');
      setRefreshProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRefreshStatus('Fetching device configuration...');
      setRefreshProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRefreshStatus('Fetching sensor data...');
      setRefreshProgress(75);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRefreshStatus('Fetching server information...');
      setRefreshProgress(100);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRefreshStatus('Refresh completed successfully!');
      
      if (showPopup) {
        setTimeout(() => {
          setShowRefreshPopup(false);
          setRefreshProgress(0);
          setRefreshStatus('');
        }, 2000);
      }
      
      console.log('=== DEVICE REFRESH COMPLETED SUCCESSFULLY ===');
      
    } catch (error: any) {
      console.error('Error during device refresh:', error);
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar 
        backgroundColor={theme.statusBarBg} 
        barStyle={theme.statusBar} 
        translucent={true}
      />
      
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: theme.background, 
        padding: scale(16),
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || scale(16) : scale(16),
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: scaleFont(18), fontWeight: 'bold', color: theme.text }}>
            Device Dashboard
          </Text>
          <Text style={{ fontSize: scaleFont(12), color: theme.textSecondary }}>
            {device?.name || 'Unknown Device'}
          </Text>
        </View>
        
        <TouchableOpacity>
          <Icon name="cog" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Device Status Card */}
        <View style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          elevation: 4,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Icon name="cellphone" size={24} color={theme.primary} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
              Device Status
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            <View style={{ flex: 1, minWidth: 150 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                Battery Level
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                {deviceStatusData.batteryLevel}%
              </Text>
            </View>
            
            <View style={{ flex: 1, minWidth: 150 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                GSM Signal
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                {deviceStatusData.gsmSignal}
              </Text>
            </View>
            
            <View style={{ flex: 1, minWidth: 150 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                Latitude
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                {deviceStatusData.latitude}
              </Text>
            </View>
            
            <View style={{ flex: 1, minWidth: 150 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                Longitude
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                {deviceStatusData.longitude}
              </Text>
            </View>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity 
          style={{
            backgroundColor: theme.primary,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            elevation: 4,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          onPress={() => refreshAllDeviceData(true)}
          activeOpacity={0.8}
        >
          <Icon name="refresh" size={20} color={theme.text} style={{ marginRight: 12 }} />
          <Text style={{ 
            color: theme.text, 
            fontSize: 16, 
            fontWeight: '600',
            textAlign: 'center',
          }}>
            Refresh Device Data
          </Text>
        </TouchableOpacity>

        {/* Auto-fetch Status */}
        <View style={{
          backgroundColor: theme.isDark ? '#2a2a2a' : '#f8f9fa',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
            Auto-fetch Status
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {autoFetchCompleted ? 'Fetched' : 'Fetching...'}
          </Text>
          {lastFetchTime && (
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              Last fetch: {lastFetchTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Refresh Popup */}
      {showRefreshPopup && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 24,
            margin: 32,
            alignItems: 'center',
            elevation: 8,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
          }}>
            <ActivityIndicator size="large" color={theme.primary} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
              Refreshing Device Data
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>
              {refreshStatus}
            </Text>
            <View style={{
              width: '100%',
              height: 8,
              backgroundColor: theme.border,
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <View style={{
                width: `${refreshProgress}%`,
                height: '100%',
                backgroundColor: theme.primary,
                borderRadius: 4,
              }} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
