import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  Platform, 
  ScrollView,
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { scale, scaleFont } from '../utils/responsive';
import { saveToStorage, loadFromStorage } from '../services/StorageService';
import { STORAGE_KEYS } from '../utils/constants';

interface SettingsScreenProps {
  navigation: any;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, themeType, setThemeType, toggleTheme } = useTheme();
  
  // Settings State
  const [selectedSim, setSelectedSim] = useState('Jio');
  const [selectedSensor, setSelectedSensor] = useState('Chlorine level');
  const [selectedDateFormat, setSelectedDateFormat] = useState('DD/MM/YYYY HH:mm:ss');
  const [serverSiteName, setServerSiteName] = useState('Site-001');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSim = await loadFromStorage(STORAGE_KEYS.SELECTED_SIM, 'Jio');
        const savedSensor = await loadFromStorage(STORAGE_KEYS.SELECTED_SENSOR, 'Chlorine level');
        const savedDateFormat = await loadFromStorage(STORAGE_KEYS.SELECTED_DATE_FORMAT, 'DD/MM/YYYY HH:mm:ss');
        const savedServerSite = await loadFromStorage(STORAGE_KEYS.SERVER_SITE_NAME, 'Site-001');
        const savedNotifications = await loadFromStorage('notifications_enabled', true);
        const savedAutoRefresh = await loadFromStorage(STORAGE_KEYS.AUTO_REFRESH_ENABLED, false);
        const savedAutoRefreshInterval = await loadFromStorage(STORAGE_KEYS.AUTO_REFRESH_INTERVAL, 30);

        setSelectedSim(savedSim);
        setSelectedSensor(savedSensor);
        setSelectedDateFormat(savedDateFormat);
        setServerSiteName(savedServerSite);
        setNotificationsEnabled(savedNotifications);
        setAutoRefreshEnabled(savedAutoRefresh);
        setAutoRefreshInterval(savedAutoRefreshInterval);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings when they change
  const saveSetting = async (key: string, value: any) => {
    try {
      await saveToStorage(key, value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleSimChange = (sim: string) => {
    setSelectedSim(sim);
    saveSetting(STORAGE_KEYS.SELECTED_SIM, sim);
  };

  const handleSensorChange = (sensor: string) => {
    setSelectedSensor(sensor);
    saveSetting(STORAGE_KEYS.SELECTED_SENSOR, sensor);
  };

  const handleDateFormatChange = (format: string) => {
    setSelectedDateFormat(format);
    saveSetting(STORAGE_KEYS.SELECTED_DATE_FORMAT, format);
  };

  const handleServerSiteChange = (site: string) => {
    setServerSiteName(site);
    saveSetting(STORAGE_KEYS.SERVER_SITE_NAME, site);
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    saveSetting('notifications_enabled', enabled);
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    saveSetting(STORAGE_KEYS.AUTO_REFRESH_ENABLED, enabled);
  };

  const handleAutoRefreshIntervalChange = (interval: number) => {
    setAutoRefreshInterval(interval);
    saveSetting(STORAGE_KEYS.AUTO_REFRESH_INTERVAL, interval);
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onPress, 
    showArrow = true,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => {}
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surface,
        padding: 16,
        marginBottom: 1,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
      }}>
        <Icon name={icon} size={20} color={theme.primary} />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            {subtitle}
          </Text>
        )}
        {value && (
          <Text style={{ fontSize: 14, color: theme.primary, marginTop: 2 }}>
            {value}
          </Text>
        )}
      </View>
      
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.border, true: theme.primaryLight }}
          thumbColor={switchValue ? theme.primary : theme.textSecondary}
        />
      )}
      
      {showArrow && !showSwitch && (
        <Icon name="chevron-right" size={24} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

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
            Settings
          </Text>
        </View>
        
        <View style={{ width: 24 }} />
      </View>

      {/* Settings Content */}
      <ScrollView style={{ flex: 1 }}>
        {/* Theme Settings */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: theme.text, 
            marginHorizontal: 16, 
            marginBottom: 12 
          }}>
            Appearance
          </Text>
          
          <View style={{ backgroundColor: theme.surface, marginHorizontal: 16, borderRadius: 12 }}>
            <SettingItem
              icon="theme-light-dark"
              title="Theme"
              subtitle="Choose your preferred theme"
              value={themeType === 'system' ? 'System' : themeType === 'dark' ? 'Dark' : 'Light'}
              onPress={() => {
                // Show theme selection modal or navigate to theme screen
                console.log('Theme selection pressed');
              }}
            />
          </View>
        </View>

        {/* Device Settings */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: theme.text, 
            marginHorizontal: 16, 
            marginBottom: 12 
          }}>
            Device Configuration
          </Text>
          
          <View style={{ backgroundColor: theme.surface, marginHorizontal: 16, borderRadius: 12 }}>
            <SettingItem
              icon="cellphone"
              title="Server Site Name"
              subtitle="Configure server site name"
              value={serverSiteName}
              onPress={() => {
                // Show input modal for server site name
                console.log('Server site name pressed');
              }}
            />
            
            <SettingItem
              icon="sim"
              title="Selected SIM"
              subtitle="Choose your SIM provider"
              value={selectedSim}
              onPress={() => {
                // Show SIM selection modal
                console.log('SIM selection pressed');
              }}
            />
            
            <SettingItem
              icon="format-list-bulleted"
              title="Selected Sensor"
              subtitle="Choose your sensor type"
              value={selectedSensor}
              onPress={() => {
                // Show sensor selection modal
                console.log('Sensor selection pressed');
              }}
            />
            
            <SettingItem
              icon="calendar"
              title="Date Format"
              subtitle="Choose your date format"
              value={selectedDateFormat}
              onPress={() => {
                // Show date format selection modal
                console.log('Date format pressed');
              }}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: theme.text, 
            marginHorizontal: 16, 
            marginBottom: 12 
          }}>
            App Settings
          </Text>
          
          <View style={{ backgroundColor: theme.surface, marginHorizontal: 16, borderRadius: 12 }}>
            <SettingItem
              icon="bell"
              title="Notifications"
              subtitle="Enable push notifications"
              showSwitch={true}
              switchValue={notificationsEnabled}
              onSwitchChange={handleNotificationsToggle}
              showArrow={false}
            />
            
            <SettingItem
              icon="refresh"
              title="Auto Refresh"
              subtitle="Automatically refresh device data"
              showSwitch={true}
              switchValue={autoRefreshEnabled}
              onSwitchChange={handleAutoRefreshToggle}
              showArrow={false}
            />
            
            {autoRefreshEnabled && (
              <SettingItem
                icon="timer"
                title="Refresh Interval"
                subtitle="Set auto-refresh interval"
                value={`${autoRefreshInterval} seconds`}
                onPress={() => {
                  // Show interval selection modal
                  console.log('Refresh interval pressed');
                }}
              />
            )}
          </View>
        </View>

        {/* About */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: theme.text, 
            marginHorizontal: 16, 
            marginBottom: 12 
          }}>
            About
          </Text>
          
          <View style={{ backgroundColor: theme.surface, marginHorizontal: 16, borderRadius: 12 }}>
            <SettingItem
              icon="information"
              title="App Version"
              subtitle="Current version information"
              value="1.0.0"
              onPress={() => {
                // Show version info
                console.log('Version info pressed');
              }}
            />
            
            <SettingItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help and support"
              onPress={() => {
                // Navigate to help screen
                console.log('Help pressed');
              }}
            />
            
            <SettingItem
              icon="file-document"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              onPress={() => {
                // Navigate to privacy policy
                console.log('Privacy policy pressed');
              }}
            />
            
            <SettingItem
              icon="file-document-outline"
              title="Terms of Service"
              subtitle="Read our terms of service"
              onPress={() => {
                // Navigate to terms of service
                console.log('Terms of service pressed');
              }}
            />
          </View>
        </View>

        {/* Reset Settings */}
        <View style={{ marginBottom: 32 }}>
          <TouchableOpacity 
            style={{
              backgroundColor: theme.error,
              marginHorizontal: 16,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={() => {
              // Show confirmation dialog for reset
              console.log('Reset settings pressed');
            }}
          >
            <Text style={{ 
              color: theme.text, 
              fontSize: 16, 
              fontWeight: '600' 
            }}>
              Reset All Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}



