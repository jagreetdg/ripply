import { useColorScheme as _useColorScheme } from 'react-native';

/**
 * A simplified implementation of useColorScheme that just returns the native value
 * This avoids any potential state update loops
 */
export function useColorScheme(): 'light' | 'dark' | null {
  // Simply return the native color scheme directly
  return _useColorScheme() || 'light';
}
