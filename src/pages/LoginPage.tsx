import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../services/auth.service';
import { AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo([]);

    try {
      setDebugInfo(prev => [...prev, `Tentative de connexion pour l'utilisateur: ${username}`]);

      // First try to authenticate with Firebase
      const email = username === 'administrateur' ? 'admin@example.com' : username;
      setDebugInfo(prev => [...prev, `Utilisation de l'email: ${email} pour Firebase Auth`]);

      try {
        const result = await AuthService.signIn(username, password);
        setDebugInfo(prev => [...prev, 'Authentification Firebase réussie']);
        setDebugInfo(prev => [...prev, `UID: ${result.user.uid}`]);
        setDebugInfo(prev => [...prev, `Email vérifié: ${result.user.emailVerified}`]);
      } catch (firebaseError: any) {
        setDebugInfo(prev => [...prev, `Erreur Firebase Auth: ${firebaseError.code}`]);
        setDebugInfo(prev => [...prev, `Message d'erreur: ${firebaseError.message}`]);
        setDebugInfo(prev => [...prev, `Stack trace: ${firebaseError.stack}`]);
        
        switch (firebaseError.code) {
          case 'auth/invalid-email':
            setError('Format d\'email invalide');
            break;
          case 'auth/user-not-found':
            setError('Utilisateur non trouvé');
            break;
          case 'auth/wrong-password':
            setError('Mot de passe incorrect');
            break;
          case 'auth/invalid-credential':
            setError('Identifiants invalides');
            break;
          case 'auth/network-request-failed':
            setError('Erreur de connexion réseau. Vérifiez votre connexion internet.');
            break;
          case 'auth/operation-not-allowed':
            setError('L\'authentification par email/mot de passe n\'est pas activée.');
            break;
          default:
            setError(`Erreur d'authentification: ${firebaseError.code}`);
        }
        return;
      }
      
      // If Firebase auth succeeds, proceed with local auth
      const success = await login(username, password);
      if (success) {
        setDebugInfo(prev => [...prev, 'Connexion réussie']);
      } else {
        setDebugInfo(prev => [...prev, 'Échec de la connexion locale']);
        setError('Échec de la connexion locale');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setDebugInfo(prev => [...prev, `Erreur générale: ${err.message}`]);
      setDebugInfo(prev => [...prev, `Stack trace: ${err.stack}`]);
      setError('Une erreur est survenue lors de la connexion');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%C3%89lectricit%C3%A9_de_France_logo.svg/512px-%C3%89lectricit%C3%A9_de_France_logo.svg.png"
              alt="EDF Logo"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Analyse de fichier TREND RPN VD4
          </h1>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Identifiant
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Erreur de connexion
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Se connecter
              </button>
            </form>

            {debugInfo.length > 0 && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Logs de connexion
                </h4>
                <div className="space-y-1">
                  {debugInfo.map((log, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mt-8">
        Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2
        </div>
      </div>
    </div>
  );
};