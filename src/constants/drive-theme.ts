import { MD3LightTheme } from 'react-native-paper';

export const DriveColors = {
  background: '#F5F7F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1EC',
  white: '#FFFFFF',
  ink: '#1E2923',
  muted: '#68736B',
  line: '#DDE3DC',
  green: '#246044',
  lime: '#D8EF72',
  danger: '#B3433C',
};

export const DrivePaperTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: DriveColors.green,
    onPrimary: DriveColors.white,
    primaryContainer: '#E8EFE8',
    onPrimaryContainer: DriveColors.green,
    secondary: DriveColors.lime,
    onSecondary: DriveColors.ink,
    background: DriveColors.background,
    surface: DriveColors.white,
    onSurface: DriveColors.ink,
    onSurfaceVariant: DriveColors.muted,
    surfaceVariant: DriveColors.surfaceMuted,
    outline: DriveColors.line,
    outlineVariant: DriveColors.line,
    error: DriveColors.danger,
  },
};