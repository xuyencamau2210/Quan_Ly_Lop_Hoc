import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with required Google Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.setCustomParameters({
  prompt: 'consent'
});

// Flag to prevent race conditions during sign-in
let isSigningIn = false;

// Cache the access token strictly in memory (NOT in localStorage or sessionStorage for security)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Auth state listeners
type AuthCallback = (user: User | null, token: string | null) => void;
const listeners: Set<AuthCallback> = new Set();

const notifyListeners = (user: User | null, token: string | null) => {
  listeners.forEach(cb => {
    try {
      cb(user, token);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
};

/**
 * Initialize auth listener on app boot
 */
export const initAuth = (callback?: AuthCallback): (() => void) => {
  if (callback) {
    listeners.add(callback);
    // Trigger immediately with current state
    callback(cachedUser, cachedAccessToken);
  }

  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (!user) {
      cachedAccessToken = null;
      notifyListeners(null, null);
    } else {
      if (cachedAccessToken) {
        notifyListeners(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token was cleared on page reload or expired; user remains in Firebase Auth
        // User will trigger signInWithPopup or refresh when performing Workspace action
        notifyListeners(user, null);
      }
    }
  });

  return () => {
    if (callback) listeners.delete(callback);
    unsubscribe();
  };
};

/**
 * Trigger official Google Sign-In with Workspace OAuth scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy mã truy cập (access token) từ Google. Vui lòng thử lại.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached access token (memory-only)
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set or update cached access token (in memory)
 */
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  notifyListeners(cachedUser, cachedAccessToken);
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

/**
 * Sign out and purge in-memory credentials
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    cachedUser = null;
    notifyListeners(null, null);
  }
};
