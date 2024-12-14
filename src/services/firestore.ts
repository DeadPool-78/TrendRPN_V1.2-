import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LoginLog, User } from '../types/auth';

// Initialize admin user if it doesn't exist
export const initializeAdminUser = async () => {
  try {
    const adminQuery = query(
      collection(db, 'users'), 
      where('username', '==', 'administrateur')
    );
    const querySnapshot = await getDocs(adminQuery);

    if (querySnapshot.empty) {
      // Create admin user in Firestore
      await setDoc(doc(db, 'users', 'W0mdFIxF8NOZq8d3IiZA'), {
        username: 'administrateur',
        password: 'Administr@teur',
        email: 'admin@example.com',
        role: 'admin',
        lastLogin: null,
        loginCount: 0,
        ip: null
      });

      // Try to create admin user in Firebase Auth
      try {
        const { AuthService } = await import('./auth.service');
        await AuthService.createUser('admin@example.com', 'Administr@teur');
      } catch (authError) {
        console.log('Admin user may already exist in Firebase Auth');
      }
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    return {
      id: userDoc.id,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      role: userData.role,
      lastLogin: userData.lastLogin ? userData.lastLogin.toDate().toISOString() : null,
      loginCount: userData.loginCount,
      ip: userData.ip
    };
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUserLoginInfo = async (
  userId: string, 
  updates: { lastLogin: string; loginCount: number; ip: string }
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastLogin: Timestamp.fromDate(new Date(updates.lastLogin)),
      loginCount: updates.loginCount,
      ip: updates.ip
    });
  } catch (error) {
    console.error('Error updating user login info:', error);
    throw error;
  }
};

export const addLoginLog = async (log: Omit<LoginLog, 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'loginLogs'), {
      ...log,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding login log:', error);
    throw error;
  }
};

export const getLoginLogs = async (): Promise<LoginLog[]> => {
  try {
    const logsRef = collection(db, 'loginLogs');
    const q = query(logsRef);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        username: data.username,
        timestamp: data.timestamp.toDate().toISOString(),
        ip: data.ip
      };
    });
  } catch (error) {
    console.error('Error getting login logs:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<User, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      lastLogin: null,
      loginCount: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};