import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DataAnalysisApp } from './DataAnalysisApp';
import { UserManagement } from './UserManagement';
import { User, LogOut } from 'lucide-react';

const footerText = "Développé par Kévin LANDAIS - EDF - CNPE Gravelines - 12-2024 - V1.2";

export const MainApp: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  if (showUserManagement && currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-[1920px] mx-auto px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%C3%89lectricit%C3%A9_de_France_logo.svg/512px-%C3%89lectricit%C3%A9_de_France_logo.svg.png"
                  alt="EDF Logo"
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold text-gray-900">
                  Analyse de fichier TREND RPN VD4
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-900"
                >
                  Retour à l'application
                </button>
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-1.5 rounded-full hover:bg-gray-100"
                      onClick={() => setShowUserInfo(!showUserInfo)}
                      onMouseEnter={() => setShowUserInfo(true)}
                      onMouseLeave={() => setShowUserInfo(false)}
                    >
                      <User className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowUserManagement(true)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Gestion des utilisateurs
                    </button>
                  </div>
                  {showUserInfo && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 text-sm z-50">
                      <div>Utilisateur: {currentUser?.username}</div>
                      <div>Dernière connexion: {currentUser?.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : '-'}</div>
                      <div>Nombre de connexions: {currentUser?.loginCount}</div>
                      <div>IP: {currentUser?.ip || '-'}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1920px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <UserManagement />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-[1920px] mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%C3%89lectricit%C3%A9_de_France_logo.svg/512px-%C3%89lectricit%C3%A9_de_France_logo.svg.png"
                alt="EDF Logo"
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-gray-900">
                Analyse de fichier TREND RPN VD4
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser?.role === 'admin' && (
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100"
                    onClick={() => setShowUserInfo(!showUserInfo)}
                    onMouseEnter={() => setShowUserInfo(true)}
                    onMouseLeave={() => setShowUserInfo(false)}
                  >
                    <User className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setShowUserManagement(true)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Gestion des utilisateurs
                  </button>
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <DataAnalysisApp />
      </div>

      <footer className="mt-8 py-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600">
          {footerText}
        </div>
      </footer>
    </div>
  );
};