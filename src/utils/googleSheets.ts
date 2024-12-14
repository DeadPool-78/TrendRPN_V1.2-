import { GoogleSpreadsheet } from 'google-spreadsheet';

const SPREADSHEET_ID = '1fnsiJgi5yF1lOMkFCPirKSrnhBXqj4yep13VSn7lviA';
const SHEET_ID = 0;

interface UserData {
  username: string;
  password: string;
  lastLogin?: string;
  loginCount?: number;
  ip?: string;
}

// Fonction simplifiée pour simuler la vérification des identifiants
export async function verifyCredentials(username: string, password: string): Promise<UserData | null> {
  try {
    // Pour l'instant, on vérifie uniquement l'administrateur
    if (username === 'administrateur' && password === 'Administr@teur') {
      return {
        username,
        password,
        lastLogin: new Date().toISOString(),
        loginCount: 1
      };
    }
    return null;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}

// Fonction simplifiée pour simuler la mise à jour des informations
export async function updateUserLoginInfo(username: string, ip: string): Promise<void> {
  try {
    console.log(`User login info updated - Username: ${username}, IP: ${ip}`);
  } catch (error) {
    console.error('Error updating user info:', error);
  }
}