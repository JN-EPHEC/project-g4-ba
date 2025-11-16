import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { createUser, getUser, updateUser as updateUserInDb } from '@/services/user.service';
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
  updateUser: (updates: Partial<AnyUser>) => Promise<void>;
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
 * Provider pour le contexte d'authentification avec Firebase
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Écouter les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Utilisateur connecté - récupérer ses données depuis Firestore
        try {
          const userData = await getUser(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          setUser(null);
        }
      } else {
        // Utilisateur déconnecté
        setUser(null);
      }
      setIsLoading(false);
    });

    // Nettoyer l'écouteur lors du démontage
    return () => unsubscribe();
  }, []);

  /**
   * Connexion avec email et mot de passe
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUser(userCredential.user.uid);
      setUser(userData);
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);

      // Messages d'erreur en français
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Ce compte a été désactivé';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou mot de passe incorrect';
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inscription avec email, mot de passe et informations de profil
   */
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => {
    try {
      setIsLoading(true);

      // Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Créer le profil utilisateur dans Firestore
      const userData = await createUser(
        userCredential.user.uid,
        email,
        firstName,
        lastName,
        role
      );

      setUser(userData);
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);

      // Messages d'erreur en français
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw new Error('Une erreur est survenue lors de la déconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mettre à jour le profil utilisateur
   */
  const updateUser = async (updates: Partial<AnyUser>) => {
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      await updateUserInDb(user.id, updates);

      // Mettre à jour l'état local
      const updatedUser = { ...user, ...updates } as AnyUser;
      setUser(updatedUser);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw new Error('Une erreur est survenue lors de la mise à jour du profil');
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
