---
description: 
globs: 
alwaysApply: true
---
# React Native + TypeScript Expert Roo Code Rules

## Expertise
You are an expert in TypeScript, React Native, Expo, and Mobile UI/App Development.

---

## Code Style and Structure

- Write concise, type-safe TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Use hooks over class components.
- Ensure components are modular, reusable, and maintainable.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Organize files by feature, grouping related components, hooks, and styles.
- Structure files: exported component, subcomponents, helpers, static content, types.
- Follow Expo's official documentation for setup and configuration: https://docs.expo.dev/

---

## Naming Conventions

- Use camelCase for variables and function names (e.g., isFetchingData, handleUserInput).
- Use PascalCase for component names (e.g., UserProfile, ChatScreen).
- Use lowercase with dashes for directories (e.g., user-profile, auth-wizard).
- Favor named exports for components.

---

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types for props and state.
- Use `React.FC` for defining functional components with props.
- Enable strict mode in `tsconfig.json` for better type safety.
- Avoid `any`; strive for precise types.
- Avoid enums; use maps instead.

---

## Syntax and Formatting

- Use the `function` keyword for pure functions.
- Avoid unnecessary curly braces in simple conditionals.
- Use declarative JSX.
- Use Prettier for consistent code formatting.

---

## UI and Styling

- Use Expo's built-in components for common UI patterns.
- Implement responsive design with Flexbox and `useWindowDimensions`.
- Use `styled-components`, `Tailwind CSS`, or `StyleSheet.create()` for styling.
- Implement dark mode support with `useColorScheme`.
- Ensure accessibility (a11y) using ARIA roles and native props.
- Use performant image libraries like `react-native-fast-image` or `expo-image`.

---

## Safe Area Management

- Use `SafeAreaProvider` from `react-native-safe-area-context` globally.
- Wrap top-level components with `SafeAreaView`.
- Use `SafeAreaScrollView` for scrollable content.
- Avoid hardcoding padding or margins for safe areas.

---

## Performance Optimization

- Minimize use of `useState` and `useEffect`; prefer context and reducers.
- Use `React.memo`, `useMemo`, and `useCallback` to avoid unnecessary re-renders.
- Optimize FlatLists with `removeClippedSubviews`, `maxToRenderPerBatch`, `windowSize`, and `getItemLayout`.
- Avoid anonymous functions in `renderItem` or event handlers.
- Use Expo's `AppLoading` and `SplashScreen` for fast app startup.
- Implement code splitting and lazy loading with `Suspense` and dynamic imports.
- Profile and monitor using Expo and React Native tools.

---

## Navigation

- Use `react-navigation` for routing; follow best practices for stack, tab, and drawer.
- Use dynamic routes with `expo-router`.
- Enable deep linking and universal links for better UX.

---

## State Management

- Use `useReducer` and `React.Context` for global state.
- Use `react-query` for API caching and fetching.
- Consider Zustand or Redux Toolkit for complex state.
- Handle URL parameters with `expo-linking`.

---

## Error Handling and Validation

- Use Zod for schema validation.
- Prioritize early error detection with `if-return` patterns.
- Avoid deep nesting and unnecessary `else` blocks.
- Implement global error boundaries.
- Use Sentry or `expo-error-reporter` for production error tracking.

---

## Testing

- Use Jest and React Native Testing Library for unit tests.
- Use Detox for integration tests.
- Utilize Expo’s testing tools across environments.
- Use snapshot testing for UI consistency.

---

## Security

- Sanitize inputs to prevent XSS attacks.
- Use `react-native-encrypted-storage` for sensitive data.
- Communicate via HTTPS with proper authentication.
- Follow Expo’s security guide: https://docs.expo.dev/guides/security/

---

## Internationalization (i18n)

- Use `expo-localization` or `react-native-i18n`.
- Support multiple languages and RTL layouts.
- Ensure scalable text and accessible fonts.

---

## Key Conventions

1. Use Expo’s managed workflow for streamlined development.
2. Prioritize Mobile Web Vitals: Load Time, Jank, Responsiveness.
3. Use `expo-constants` for config and env variables.
4. Use `expo-permissions` to handle device permissions.
5. Use `expo-updates` for OTA updates.
6. Follow Expo’s deployment practices: https://docs.expo.dev/distribution/introduction/
7. Test extensively across iOS and Android.

---

## API Documentation

- Refer to Expo's documentation for Views, Blueprints, and Extensions.
- Follow official Expo docs: https://docs.expo.dev/
