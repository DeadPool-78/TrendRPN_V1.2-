import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/auth';

export class UserService {
  private static readonly COLLECTION = 'users';

  static async createUser(userData: Omit<User, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION), userData);
      return docRef.id;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION), 
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      return {
        ...userDoc.data(),
        id: userDoc.id
      } as User;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, userId);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, userId));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
}