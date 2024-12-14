import { auth, db } from '../../config/firebase';
import { AuthService } from './auth.service';
import { UsersService } from '../firestore/users.service';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export class AuthInitializer {
  static async initialize(): Promise<void> {
    try {
      console.log('Starting auth initialization...');

      // First, ensure admin document exists in Firestore
      const adminDocRef = doc(db, 'users', 'W0mdFIxF8NOZq8d3IiZA');
      
      try {
        await setDoc(adminDocRef, {
          username: 'administrateur',
          email: 'admin@example.com',
          password: 'Administr@teur',
          role: 'admin',
          lastLogin: null,
          loginCount: 0,
          ip: null,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        }, { merge: true });
        
        console.log('Admin document initialized in Firestore');
      } catch (error: any) {
        console.error('Error initializing admin document:', {
          code: error.code,
          message: error.message,
          details: error
        });
        throw error;
      }

      // Then try to create admin in Firebase Auth
      try {
        const adminCredential = await createUserWithEmailAndPassword(
          auth,
          'admin@example.com',
          'Administr@teur'
        );
        console.log('Admin user created in Firebase Auth:', adminCredential.user.uid);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('Admin user already exists in Firebase Auth');
          
          // Verify admin credentials
          try {
            const credential = await signInWithEmailAndPassword(
              auth,
              'admin@example.com',
              'Administr@teur'
            );
            console.log('Admin credentials verified:', credential.user.uid);
            await auth.signOut();
          } catch (verifyError: any) {
            console.error('Admin verification failed:', {
              code: verifyError.code,
              message: verifyError.message,
              details: verifyError
            });
            throw verifyError;
          }
        } else {
          console.error('Error creating admin user:', {
            code: error.code,
            message: error.message,
            details: error
          });
          throw error;
        }
      }

      console.log('Auth initialization completed successfully');
    } catch (error: any) {
      console.error('Auth initialization failed:', {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    }
  }
}