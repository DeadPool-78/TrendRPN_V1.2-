import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  UserCredential,
  AuthError,
  onAuthStateChanged
} from 'firebase/auth';

export class AuthService {
  static async signIn(username: string, password: string): Promise<UserCredential> {
    try {
      // Convert username to email format for Firebase Auth
      let email: string;
      if (username === 'administrateur') {
        email = 'admin@example.com';
      } else if (username.includes('@')) {
        email = username;
      } else {
        email = `${username.toLowerCase()}@trend-38896.firebaseapp.com`;
      }

      console.log('Attempting Firebase Auth with:', { 
        email,
        authInstance: !!auth,
        currentUser: auth.currentUser?.email
      });

      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth successful:', {
        user: result.user.email,
        emailVerified: result.user.emailVerified,
        uid: result.user.uid
      });

      return result;
    } catch (error: any) {
      const authError = error as AuthError;
      console.error('Firebase Auth error:', {
        code: authError.code,
        message: authError.message,
        email: username.includes('@') ? username : `${username.toLowerCase()}@trend-38896.firebaseapp.com`,
        stack: authError.stack
      });
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async createUser(email: string, password: string): Promise<UserCredential> {
    try {
      console.log('Creating new Firebase Auth user:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', {
        email: result.user.email,
        uid: result.user.uid
      });
      return result;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('User already exists in Firebase Auth:', email);
        return {} as UserCredential;
      }
      console.error('Create user error:', {
        code: error.code,
        message: error.message,
        email,
        stack: error.stack
      });
      throw error;
    }
  }

  static getCurrentUser() {
    return auth.currentUser;
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', {
        user: user?.email,
        isAuthenticated: !!user
      });
      callback(user);
    });
  }
}