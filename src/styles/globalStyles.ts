import { StyleSheet } from 'react-native';
import { lightTheme, darkTheme } from '../contexts/ThemeContext';
import { scale, scaleFont, getSpacing } from '../utils/responsive';

// Global styles that can be used across the application
export const createGlobalStyles = (theme: typeof lightTheme) => StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: scaleFont(12),
    color: theme.textSecondary,
    textAlign: 'center',
  },
  
  // Card styles
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: scale(16),
    marginBottom: scale(16),
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  
  cardTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: theme.text,
    marginLeft: scale(8),
  },
  
  // Button styles
  button: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  buttonText: {
    color: theme.text,
    fontSize: scaleFont(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  
  buttonSecondary: {
    backgroundColor: theme.isDark ? '#2a2a2a' : '#f0f0f0',
    borderRadius: 12,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  
  buttonSecondaryText: {
    color: theme.textSecondary,
    fontSize: scaleFont(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  
  buttonSuccess: {
    backgroundColor: theme.success,
    borderRadius: 12,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  buttonWarning: {
    backgroundColor: theme.warning,
    borderRadius: 12,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.warning,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  buttonError: {
    backgroundColor: theme.error,
    borderRadius: 12,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.error,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  // Text styles
  text: {
    color: theme.text,
    fontSize: scaleFont(16),
  },
  
  textSecondary: {
    color: theme.textSecondary,
    fontSize: scaleFont(14),
  },
  
  textTertiary: {
    color: theme.textTertiary,
    fontSize: scaleFont(12),
  },
  
  textBold: {
    color: theme.text,
    fontSize: scaleFont(16),
    fontWeight: 'bold',
  },
  
  textLarge: {
    color: theme.text,
    fontSize: scaleFont(20),
    fontWeight: '600',
  },
  
  textSmall: {
    color: theme.textSecondary,
    fontSize: scaleFont(12),
  },
  
  // Input styles
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: scaleFont(16),
    color: theme.text,
  },
  
  inputFocused: {
    borderColor: theme.primary,
    backgroundColor: theme.surface,
  },
  
  inputError: {
    borderColor: theme.error,
    backgroundColor: theme.surface,
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: scale(16),
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  
  listItemText: {
    flex: 1,
    fontSize: scaleFont(16),
    color: theme.text,
  },
  
  listItemSubtext: {
    fontSize: scaleFont(14),
    color: theme.textSecondary,
    marginTop: 2,
  },
  
  // Status styles
  statusSuccess: {
    backgroundColor: theme.success,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: 6,
  },
  
  statusWarning: {
    backgroundColor: theme.warning,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: 6,
  },
  
  statusError: {
    backgroundColor: theme.error,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: 6,
  },
  
  statusInfo: {
    backgroundColor: theme.info,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: 6,
  },
  
  statusText: {
    color: theme.text,
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  
  // Icon styles
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  
  iconSmall: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Divider styles
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: scale(8),
  },
  
  dividerVertical: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: scale(8),
  },
  
  // Spacing utilities
  marginTop: {
    marginTop: getSpacing(16),
  },
  
  marginBottom: {
    marginBottom: getSpacing(16),
  },
  
  marginLeft: {
    marginLeft: getSpacing(16),
  },
  
  marginRight: {
    marginRight: getSpacing(16),
  },
  
  padding: {
    padding: getSpacing(16),
  },
  
  paddingHorizontal: {
    paddingHorizontal: getSpacing(16),
  },
  
  paddingVertical: {
    paddingVertical: getSpacing(16),
  },
  
  // Flex utilities
  flex1: {
    flex: 1,
  },
  
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  // Border radius utilities
  roundedSmall: {
    borderRadius: 8,
  },
  
  roundedMedium: {
    borderRadius: 12,
  },
  
  roundedLarge: {
    borderRadius: 16,
  },
  
  roundedFull: {
    borderRadius: 999,
  },
  
  // Shadow utilities
  shadowSmall: {
    elevation: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  shadowMedium: {
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  shadowLarge: {
    elevation: 8,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});

// Export light and dark theme styles
export const lightStyles = createGlobalStyles(lightTheme);
export const darkStyles = createGlobalStyles(darkTheme);



