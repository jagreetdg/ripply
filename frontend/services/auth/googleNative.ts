import { Platform } from "react-native";
import {
  GoogleSignin,
  statusCodes,
  type User as GoogleUser,
} from "@react-native-google-signin/google-signin";

/**
 * Lightweight wrapper around @react-native-google-signin/google-signin
 * Handles configuration and sign-in flow for native platforms.
 */

let configured = false;

function getWebClientId(): string | undefined {
  // Prefer env var if available (Expo public env)
  // Falls back to app.json managed config via expo-constants if needed later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envAny: any = process.env as any;
  return envAny.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || envAny.GOOGLE_WEB_CLIENT_ID;
}

function getIosClientId(): string | undefined {
  // Optional: dedicated iOS client ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envAny: any = process.env as any;
  return envAny.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || envAny.GOOGLE_IOS_CLIENT_ID;
}

export async function configureGoogleSignIn(): Promise<void> {
  if (configured || Platform.OS === "web") return;

  const webClientId = getWebClientId();
  const iosClientId = getIosClientId();
  // Configure with whatever we have; webClientId is required for idToken on iOS/Android
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    scopes: ["profile", "email"],
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });

  configured = true;
}

export interface NativeGoogleSignInResult {
  idToken?: string;
  user?: GoogleUser;
}

export async function signInWithGoogleNative(): Promise<NativeGoogleSignInResult> {
  if (Platform.OS === "web") {
    return {};
  }

  await configureGoogleSignIn();

  try {
    const hasPlayServices =
      Platform.OS === "android" ? await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true }) : true;
    if (!hasPlayServices) {
      throw new Error("Google Play Services not available");
    }

    await GoogleSignin.signIn();
    const { idToken } = await GoogleSignin.getTokens();
    const currentUser = (await GoogleSignin.getCurrentUser()) ?? undefined;
    return { idToken: idToken ?? undefined, user: currentUser as unknown as GoogleUser };
  } catch (err: unknown) {
    // Map common errors into no-op/cancellation vs real errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    if (
      e?.code === statusCodes.SIGN_IN_CANCELLED ||
      e?.code === statusCodes.IN_PROGRESS ||
      e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
    ) {
      return {};
    }
    throw err;
  }
}


