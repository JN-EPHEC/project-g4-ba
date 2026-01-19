import { auth } from '@/config/firebase';
import { UserService } from '@/services/user-service';
import { AnyUser, UserRole } from '@/types';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Interface pour le contexte d'authentification
 */
/**
 * Données de configuration du totem pour l'inscription
 */
interface TotemData {
  totemAnimal?: string;
  totemEmoji?: string;
  totemTraits?: string;
  totemImageUrl?: string;
}

interface AuthContextType {
  user: AnyUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AnyUser>;
  register: (email: string, password: string, firstName: string, lastName: string, role: UserRole, unitId?: string, dateOfBirth?: Date, totemData?: TotemData, sectionId?: string) => Promise<AnyUser>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<AnyUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Écouter les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Si on est en train de s'inscrire, ne pas écraser les données
          if (isRegistering) {
            return;
          }

          // Récupérer les données utilisateur depuis Firestore
          const userData = await UserService.getUserById(firebaseUser.uid);

          if (userData) {
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      } finally {
        if (!authInitialized) {
          setAuthInitialized(true);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authInitialized, isRegistering]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await UserService.getUserById(userCredential.user.uid);

      if (!userData) {
        throw new Error('Données utilisateur introuvables');
      }

      setUser(userData);
      return userData;
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);

      let errorMessage = 'Erreur lors de la connexion';
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

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    unitId?: string,
    dateOfBirth?: Date,
    totemData?: TotemData,
    sectionId?: string
  ) => {
    try {
      setIsLoading(true);
      setIsRegistering(true);

      // Vérifier que Firebase est correctement configuré
      if (!auth.app.options.projectId || auth.app.options.projectId === 'demo-project') {
        throw new Error('Firebase n\'est pas correctement configuré. Veuillez ajouter vos clés de configuration dans le fichier .env');
      }

      // Créer le compte avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Créer le document utilisateur dans Firestore
      const additionalData: Record<string, any> = {};
      if (unitId) additionalData.unitId = unitId;
      if (sectionId) additionalData.sectionId = sectionId;
      if (dateOfBirth) additionalData.dateOfBirth = dateOfBirth;

      // Ajouter les données totem si présentes
      if (totemData) {
        if (totemData.totemAnimal) additionalData.totemAnimal = totemData.totemAnimal;
        if (totemData.totemEmoji) additionalData.totemEmoji = totemData.totemEmoji;
        if (totemData.totemTraits) additionalData.totemTraits = totemData.totemTraits;
        if (totemData.totemImageUrl) additionalData.profilePicture = totemData.totemImageUrl;
      }

      const newUser = await UserService.createUser(
        userCredential.user.uid,
        email,
        firstName,
        lastName,
        role,
        Object.keys(additionalData).length > 0 ? additionalData : undefined
      );

      setUser(newUser);
      setIsRegistering(false);
      return newUser;
    } catch (error: any) {
      setIsRegistering(false);
      console.error('Erreur lors de l\'inscription:', error);

      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.code === 'auth/email-already-in-use') {
        // L'email existe déjà dans Firebase Auth
        // Cela peut arriver si une inscription précédente a partiellement réussi
        // ou si l'utilisateur a déjà un compte
        errorMessage = 'Cet email est déjà enregistré. Essayez de vous connecter avec cet email, ou utilisez "Mot de passe oublié" si vous ne vous souvenez pas du mot de passe.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible (minimum 6 caractères)';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Clé API Firebase invalide. Vérifiez votre configuration.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      await new Promise(resolve => setTimeout(resolve, 100));
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedData: Partial<AnyUser>) => {
    if (user) {
      try {
        await UserService.updateUser(user.id, updatedData);
        const updatedUser = { ...user, ...updatedData } as AnyUser;
        setUser(updatedUser);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        throw error;
      }
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);

      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }

      throw new Error(errorMessage);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('Vous devez être connecté pour changer votre mot de passe');
    }

    try {
      // Ré-authentifier l'utilisateur avec son mot de passe actuel
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Mettre à jour le mot de passe
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);

      let errorMessage = 'Erreur lors du changement de mot de passe';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Mot de passe actuel incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le nouveau mot de passe est trop faible (minimum 6 caractères)';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Veuillez vous reconnecter avant de changer votre mot de passe';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }

      throw new Error(errorMessage);
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
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
