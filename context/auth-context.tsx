import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnyUser, UserRole, Scout, Parent, Animator } from '@/types';

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
  updateUser: (user: Partial<AnyUser>) => Promise<void>;
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
      // Récupérer l'utilisateur depuis le stockage local
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
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

      // Simuler un utilisateur Scout
      const mockUser: Scout = {
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
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
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

      // Créer le nouvel utilisateur selon le rôle
      let newUser: AnyUser;
      const userId = Date.now().toString();
      const baseUser = {
        id: userId,
        email,
        firstName,
        lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      switch (role) {
        case UserRole.SCOUT:
          newUser = {
            ...baseUser,
            role: UserRole.SCOUT,
            parentIds: [],
            unitId: '',
            points: 0,
            dateOfBirth: new Date(),
          } as Scout;
          break;
        case UserRole.PARENT:
          newUser = {
            ...baseUser,
            role: UserRole.PARENT,
            scoutIds: [],
          } as Parent;
          break;
        case UserRole.ANIMATOR:
          newUser = {
            ...baseUser,
            role: UserRole.ANIMATOR,
            unitId: '',
            isUnitLeader: false,
          } as Animator;
          break;
        default:
          throw new Error('Invalid role');
      }

      setUser(newUser as AnyUser);

      // Sauvegarder dans le stockage local
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
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
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedData: Partial<AnyUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData } as AnyUser;
      setUser(updatedUser);

      // Mettre à jour dans le stockage local
      try {
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Erreur lors de la mise à jour du stockage local:', error);
      }
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
