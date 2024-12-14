import { 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  UserCredential,
  AuthError,
  onAuthStateChanged,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export class AuthService {
  static async signIn(username: string, password: string): Promise<UserCredential> {
    try {
      let email: string;
      if (username === 'administrateur') {
        email = 'admin@example.com';
      } else if (username.includes('@')) {
        email = username;
      } else {
        email = `${username.toLowerCase()}@trend-38896.firebaseapp.com`;
      }

      console.log('Starting authentication process', { 
        username, 
        email,
        authInstance: !!auth
      });

      // First try to sign in with Firebase Auth
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth successful', {
        uid: result.user.uid,
        email: result.user.email
      });

      // Then check/update Firestore document
      const userDoc = doc(db, 'users', result.user.uid);
      const userSnapshot = await getDoc(userDoc);
      const ip = await this.getUserIP();

      // If no Firestore document exists, check for legacy document by username
      if (!userSnapshot.exists()) {
        console.log('Looking for legacy user document by username');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const legacyDoc = querySnapshot.docs[0];
          const legacyData = legacyDoc.data();
          
          // Migrate legacy document to new UID-based document
          await setDoc(userDoc, {
            ...legacyData,
            lastLogin: Timestamp.now(),
            loginCount: (legacyData.loginCount || 0) + 1,
            ip,
            lastUpdated: Timestamp.now()
          });
          
          console.log('Migrated legacy user document');
        } else {
          // Create new user document
          await setDoc(userDoc, {
            username,
            email,
            role: username === 'administrateur' ? 'admin' : 'user',
            createdAt: Timestamp.now(),
            lastLogin: Timestamp.now(),
            loginCount: 1,
            ip,
            lastUpdated: Timestamp.now()
          });
          
          console.log('Created new user document');
        }
      } else {
        // Update existing document
        const userData = userSnapshot.data();
        await setDoc(userDoc, {
          ...userData,
          lastLogin: Timestamp.now(),
          loginCount: (userData.loginCount || 0) + 1,
          ip,
          lastUpdated: Timestamp.now()
        }, { merge: true });
        
        console.log('Updated existing user document');
      }

      return result;
    } catch (error: any) {
      console.error('Authentication error:', {
        code: error.code,
        message: error.message,
        username,
        stack: error.stack
      });

      // Enhanced error messages
      switch (error.code) {
        case 'auth/user-not-found':
          throw new Error('Utilisateur non trouvé');
        case 'auth/wrong-password':
          throw new Error('Mot de passe incorrect');
        case 'auth/invalid-credential':
          throw new Error('Identifiants invalides');
        case 'auth/network-request-failed':
          throw new Error('Erreur de connexion réseau');
        case 'auth/too-many-requests':
          throw new Error('Trop de tentatives de connexion');
        default:
          throw new Error(error.message || 'Erreur de connexion');
      }
    }
  }

  private static async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  }

  static async createUser(username: string, password: string): Promise<UserCredential> {
    try {
      let email: string;
      if (username === 'administrateur') {
        email = 'admin@example.com';
      } else if (username.includes('@')) {
        email = username;
      } else {
        email = `${username.toLowerCase()}@trend-38896.firebaseapp.com`;
      }

      console.log('Starting user creation process', { username, email });

      // Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created in Firebase Auth', {
        uid: result.user.uid,
        email: result.user.email
      });

      // Create user document in Firestore
      const userDoc = doc(db, 'users', result.user.uid);
      const ip = await this.getUserIP();
      
      await setDoc(userDoc, {
        username,
        email,
        role: username === 'administrateur' ? 'admin' : 'user',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        loginCount: 1,
        ip,
        lastUpdated: Timestamp.now()
      });

      console.log('User document created in Firestore');
      return result;
    } catch (error: any) {
      console.error('User creation error:', {
        code: error.code,
        message: error.message,
        username,
        stack: error.stack
      });

      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Un compte existe déjà avec cette adresse email');
      }
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
          lastLogout: Timestamp.now(),
          lastUpdated: Timestamp.now()
        }, { merge: true });
      }
      await signOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
      console.log('Current user state:', {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified
      });
    } else {
      console.log('No current user');
    }
    return user;
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          console.log('Auth state changed - user signed in:', {
            uid: user.uid,
            email: user.email,
            firestoreData: !!userData
          });
          callback({ ...user, ...userData });
        } catch (error) {
          console.error('Error getting user data:', error);
          callback(user);
        }
      } else {
        console.log('Auth state changed - user signed out');
        callback(null);
      }
    });
  }
}