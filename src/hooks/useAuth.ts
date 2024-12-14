import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginLog } from '../types/auth';
import { UsersService } from '../services/firestore/users.service';
import { LogsService } from '../services/firestore/logs.service';
import { AuthService } from '../services/auth/auth.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AuthState {
  currentUser: User | null;
  users: User[];
  loginLogs: LoginLog[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (user: Omit<User, 'lastLogin' | 'loginCount' | 'ip'>) => void;
  updateUser: (username: string, updates: Partial<User>) => void;
  deleteUser: (username: string) => void;
  loadLoginLogs: () => Promise<void>;
}

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes
let timeoutId: NodeJS.Timeout;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      loginLogs: [],
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          // Authenticate with Firebase
          const result = await AuthService.signIn(username, password);
          
          if (!result.user) {
            console.error('No user returned from Firebase Auth');
            return false;
          }

          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          
          if (!userDoc.exists()) {
            console.error('User document not found in Firestore');
            return false;
          }

          const userData = userDoc.data();
          const now = new Date().toISOString();

          const updatedUser = {
            ...userData,
            id: result.user.uid,
            lastLogin: now,
            loginCount: (userData.loginCount || 0) + 1,
          };

          // Clear existing timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          // Set new timeout
          timeoutId = setTimeout(() => {
            set({ isAuthenticated: false, currentUser: null });
          }, TIMEOUT_DURATION);

          // Add event listeners for user activity
          const resetTimeout = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
              set({ isAuthenticated: false, currentUser: null });
            }, TIMEOUT_DURATION);
          };

          window.addEventListener('mousemove', resetTimeout);
          window.addEventListener('keypress', resetTimeout);

          set({
            isAuthenticated: true,
            currentUser: updatedUser as User,
            users: get().users.map(u => 
              u.username === username ? updatedUser as User : u
            )
          });

          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      logout: async () => {
        try {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          window.removeEventListener('mousemove', () => {});
          window.removeEventListener('keypress', () => {});
          
          await AuthService.signOut();
          set({ isAuthenticated: false, currentUser: null });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      loadLoginLogs: async () => {
        try {
          const logs = await LogsService.getLoginLogs();
          set({ loginLogs: logs });
        } catch (error) {
          console.error('Error loading login logs:', error);
        }
      },

      addUser: (newUser) => {
        const user: User = {
          ...newUser,
          lastLogin: null,
          loginCount: 0,
          ip: null
        };

        set(state => ({
          users: [...state.users, user]
        }));
      },

      updateUser: (username, updates) => {
        set(state => ({
          users: state.users.map(user =>
            user.username === username ? { ...user, ...updates } : user
          )
        }));
      },

      deleteUser: (username) => {
        set(state => ({
          users: state.users.filter(user => 
            user.username !== username && user.username !== 'administrateur'
          )
        }));
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);