import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCulyIbq6l05m-e9hceBYI281w0lnW4HWI",
  authDomain: "trend-38896.firebaseapp.com",
  projectId: "trend-38896",
  storageBucket: "trend-38896.appspot.com",
  messagingSenderId: "717380179959",
  appId: "1:717380179959:web:70c08ef67bc165a67040f2",
  measurementId: "G-0J8TGC0L27",
  databaseURL: "https://trend-38896.firebaseio.com"
};

console.log('Initializing Firebase with config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with new cache configuration
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch(error => {
    console.error("Erreur lors de la configuration de la persistance:", {
      code: error.code,
      message: error.message,
      details: "Vérifiez la configuration de l'authentification"
    });
  });

// Initialize Analytics only if supported
let analytics: Analytics | null = null;
isSupported().then(yes => {
  if (yes && typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
}).catch(error => {
  console.error('Analytics initialization error:', {
    code: error.code,
    message: error.message,
    details: error
  });
});

// Test Firebase connection and configuration
const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test auth configuration
    console.log('Current auth state:', {
      currentUser: auth.currentUser?.email,
      isInitialized: !!auth,
      authDomain: firebaseConfig.authDomain,
      persistenceEnabled: true // We know it's enabled because we set it above
    });

    // Test Firestore connection by writing to a test document
    try {
      const testRef = doc(db, '_test_connection', 'test');
      await setDoc(testRef, { 
        timestamp: new Date().toISOString(),
        test: true
      }, { merge: true });
      console.log('Test document written successfully');
      
      // Clean up test document
      await setDoc(testRef, { 
        deleted: true,
        deletedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error: any) {
      console.error('Firestore write test failed:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error('Firebase connection test failed:', {
      code: error.code,
      message: error.message,
      details: error
    });
    throw error;
  }
};

// Run connection test
testFirebaseConnection().catch(error => {
  console.error('Firebase connection test error:', {
    code: error.code,
    message: error.message,
    details: error
  });
});

export { app, analytics, db, auth };