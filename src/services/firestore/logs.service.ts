import { 
  collection, 
  addDoc, 
  query, 
  getDocs,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LoginLog } from '../../types/auth';

export class LogsService {
  private static readonly COLLECTION = 'loginLogs';

  static async addLoginLog(log: Omit<LoginLog, 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTION), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding login log:', error);
      throw error;
    }
  }

  static async getLoginLogs(limitCount: number = 100): Promise<LoginLog[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
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
  }
}