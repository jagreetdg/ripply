import { useColorScheme as _useColorScheme, ColorSchemeName } from 'react-native';
import { useEffect, useState } from 'react';

/**
 * A stable implementation of useColorScheme that won't cause infinite loops
 */
export function useColorScheme(): 'light' | 'dark' | null {
  // Default to 'light' theme
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>('light');
  
  // Only update when the native color scheme actually changes
  useEffect(() => {
    const nativeColorScheme = _useColorScheme();
    if (nativeColorScheme && nativeColorScheme !== colorScheme) {
      setColorScheme(nativeColorScheme as 'light' | 'dark');
    }
  }, []);
  
  return colorScheme;
}
