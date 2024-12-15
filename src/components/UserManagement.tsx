import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UserPlus, Trash2 } from 'lucide-react';
import { CustomDialog } from './Dialog';

export const UserManagement: React.FC = () => {
  const { users, addUser, deleteUser } = useAuth();
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<{
    username: string;
    password: string;
    email: string;
    role: 'user' | 'admin';
  }>({ 
    username: '', 
    password: '', 
    email: '',
    role: 'user'
  });
  const [error, setError] = useState('');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await AuthService.createUser(newUser.email, newUser.password);
      await UserService.createUser({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        lastLogin: null,
        loginCount: 0,
        ip: null
      });

      addUser({
        username: newUser.username,
        password: newUser.password,
        email: newUser.email,
        role: newUser.role
      });

      setShowAddUser(false);
      setNewUser({ username: '', password: '', email: '', role: 'user' });
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
      try {
        const user = await UserService.getUserByUsername(username);
        if (user?.id) {
          await UserService.deleteUser(user.id);
          deleteUser(username);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <UserPlus size={20} />
          Ajouter un utilisateur
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <CustomDialog
        title="Ajouter un utilisateur"
        description="Créez un nouvel utilisateur en remplissant le formulaire ci-dessous."
        open={showAddUser}
        onOpenChange={setShowAddUser}
      >
        <form onSubmit={handleAddUser}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rôle</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddUser(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Ajouter
            </button>
          </div>
        </form>
      </CustomDialog>

      <div className="mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.username}>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteUser(user.username)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};