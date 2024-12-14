import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types/auth';

export class UsersService {
  private static readonly COLLECTION = 'users';
  private static readonly ADMIN_ID = 'W0mdFIxF8NOZq8d3IiZA';

  static async initializeAdminUser(): Promise<void> {
    try {
      console.log('Checking admin user existence');
      const adminDoc = doc(db, this.COLLECTION, this.ADMIN_ID);
      const docSnap = await getDoc(adminDoc);

      if (!docSnap.exists()) {
        console.log('Creating admin user');
        const batch = writeBatch(db);
        
        batch.set(adminDoc, {
          username: 'administrateur',
          password: 'Administr@teur',
          email: 'admin@example.com',
          role: 'admin',
          lastLogin: null,
          loginCount: 0,
          ip: null,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        });

        await batch.commit();
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists', {
          username: docSnap.data().username,
          email: docSnap.data().email
        });
      }
    } catch (error) {
      console.error('Error initializing admin user:', error);
      throw error;
    }
  }

  static async getByUsername(username: string): Promise<User | null> {
    try {
      console.log('Getting user by username:', username);
      const q = query(collection(db, this.COLLECTION), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No user found with username:', username);
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
        loginCount: userData.loginCount || 0,
        ip: userData.ip
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      console.log('Updating user:', userId);
      const userRef = doc(db, this.COLLECTION, userId);
      await updateDoc(userRef, {
        ...data,
        lastUpdated: Timestamp.now()
      });
      console.log('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}