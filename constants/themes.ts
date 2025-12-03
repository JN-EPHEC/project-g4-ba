export interface ThemeColors {
  background: string;
  text: string;
  textSecondary?: string;
  backgroundSecondary?: string;
  accent?: string;
  border?: string;
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    backgroundSecondary: '#F5F5F5',
    accent: '#007AFF',
    border: '#E0E0E0',
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    backgroundSecondary: '#1A1A1A',
    accent: '#0A84FF',
    border: '#333333',
  },
};
