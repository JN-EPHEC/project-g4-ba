import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AnyUser, UserRole } from '@/types';

/**
 * Interface pour le contexte d'authentification
 */
interface AuthContextType {
  user: AnyUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<AnyUser>) => void;
}

/**
 * Contexte d'authentification
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

/**
 * Provider pour le contexte d'authentification
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simuler la vérification de l'authentification au démarrage
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // TODO: Implémenter la vérification avec AsyncStorage ou un backend
      // Pour l'instant, on simule juste un délai
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Récupérer l'utilisateur depuis le stockage local
      // const storedUser = await AsyncStorage.getItem('user');
      // if (storedUser) {
      //   setUser(JSON.parse(storedUser));
      // }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // TODO: Implémenter l'appel API pour la connexion
      // Pour l'instant, on simule une connexion réussie
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simuler un utilisateur
      const mockUser: AnyUser = {
        id: '1',
        email,
        firstName: 'Jean',
        lastName: 'Dupont',
        role: UserRole.SCOUT,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentIds: [],
        unitId: 'unit-1',
        points: 150,
        dateOfBirth: new Date('2010-05-15'),
      };

      setUser(mockUser);

      // Sauvegarder dans le stockage local
      // await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => {
    try {
      setIsLoading(true);

      // TODO: Implémenter l'appel API pour l'inscription
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simuler un nouvel utilisateur
      const newUser: AnyUser = {
        id: Date.now().toString(),
        email,
        firstName,
        lastName,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(role === UserRole.SCOUT && {
          parentIds: [],
          unitId: '',
          points: 0,
          dateOfBirth: new Date(),
        }),
        ...(role === UserRole.PARENT && {
          scoutIds: [],
        }),
        ...(role === UserRole.ANIMATOR && {
          unitId: '',
          isUnitLeader: false,
        }),
      };

      setUser(newUser);

      // Sauvegarder dans le stockage local
      // await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // TODO: Implémenter l'appel API pour la déconnexion
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUser(null);

      // Supprimer du stockage local
      // await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedData: Partial<AnyUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);

      // Mettre à jour dans le stockage local
      // AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
