import { z } from 'zod';

export interface User {
  id?: string;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'user';
  lastLogin: string | null;
  loginCount: number;
  ip: string | null;
}

export interface LoginLog {
  username: string;
  timestamp: string;
  ip: string;
}

export const UserSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']),
  lastLogin: z.string().nullable(),
  loginCount: z.number(),
  ip: z.string().nullable()
});

export const LoginLogSchema = z.object({
  username: z.string(),
  timestamp: z.string(),
  ip: z.string()
});