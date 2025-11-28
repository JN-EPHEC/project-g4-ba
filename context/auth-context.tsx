import { auth } from '@/config/firebase';
import { UserService } from '@/services/user-service';
import { AnyUser, UserRole } from '@/types';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Interface pour le contexte d'authentification
 */
interface AuthContextType {
  user: AnyUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: UserRole, unitId?: string) => Promise<AnyUser>;
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

  // Écouter les changements d'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Récupérer les données utilisateur depuis Firestore
          console.log('🔄 onAuthStateChanged - Récupération des données utilisateur pour UID:', firebaseUser.uid);
          const userData = await UserService.getUserById(firebaseUser.uid);
          
          if (userData) {
            console.log('✅ Données utilisateur récupérées:', userData);
            setUser(userData);
          } else {
            console.warn('⚠️ Aucune donnée utilisateur trouvée dans Firestore pour UID:', firebaseUser.uid);
            // Ne pas réinitialiser l'utilisateur si on est en train de créer un compte
            // L'utilisateur sera défini par la fonction register
          }
        } else {
          console.log('🔓 Utilisateur déconnecté');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
        // Ne pas réinitialiser l'utilisateur en cas d'erreur si on est en train de créer un compte
        // L'utilisateur sera défini par la fonction register
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Connexion avec Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Récupérer les données utilisateur depuis Firestore
      const userData = await UserService.getUserById(userCredential.user.uid);
      
      if (!userData) {
        throw new Error('Données utilisateur introuvables');
      }

      setUser(userData);
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      
      // Gérer les erreurs Firebase de manière plus conviviale
      let errorMessage = 'Erreur lors de la connexion';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Ce compte a été désactivé';
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
    unitId?: string
  ) => {
    try {
      setIsLoading(true);

      console.log('🚀 Début de l\'inscription pour:', email);
      console.log('🔑 Configuration Firebase - Project ID:', auth.app.options.projectId);
      console.log('🔑 Configuration Firebase - Auth Domain:', auth.app.options.authDomain);

      // Vérifier que Firebase est correctement configuré
      if (!auth.app.options.projectId || auth.app.options.projectId === 'demo-project') {
        throw new Error('Firebase n\'est pas correctement configuré. Veuillez ajouter vos clés de configuration dans le fichier .env');
      }

      // Créer le compte avec Firebase Auth
      console.log('📝 Création du compte Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Compte Firebase Auth créé avec succès. UID:', userCredential.user.uid);

      // Créer le document utilisateur dans Firestore
      console.log('📝 Création du document utilisateur dans Firestore...');
      const additionalData = unitId ? { unitId } : undefined;
      const newUser = await UserService.createUser(
        userCredential.user.uid,
        email,
        firstName,
        lastName,
        role,
        additionalData
      );
      console.log('✅ Document utilisateur créé dans Firestore:', newUser);

      // Attendre un peu pour s'assurer que Firestore a bien enregistré les données
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier que les données sont bien récupérables
      const verifyUser = await UserService.getUserById(userCredential.user.uid);
      if (!verifyUser) {
        throw new Error('Impossible de récupérer les données utilisateur après création');
      }
      
      setUser(verifyUser);
      console.log('✅ Inscription terminée avec succès, utilisateur défini:', verifyUser);
      
      // Retourner l'utilisateur créé
      return verifyUser;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      console.error('❌ Code d\'erreur:', error?.code);
      console.error('❌ Message d\'erreur:', error?.message);
      
      // Gérer les erreurs Firebase de manière plus conviviale
      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.code === 'auth/email-already-in-use') {
        // Si l'email existe déjà, essayer de se connecter automatiquement
        console.log('📧 Email déjà utilisé, tentative de connexion automatique...');
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log('✅ Connexion automatique réussie');
          
          // Récupérer les données utilisateur depuis Firestore
          const userData = await UserService.getUserById(userCredential.user.uid);
          
          if (userData) {
            setUser(userData);
            console.log('✅ Utilisateur récupéré depuis Firestore');
            // Retourner l'utilisateur récupéré
            return userData;
          } else {
            // L'utilisateur existe dans Auth mais pas dans Firestore, créer le document
            console.log('⚠️ Utilisateur existe dans Auth mais pas dans Firestore, création du document...');
            const newUser = await UserService.createUser(
              userCredential.user.uid,
              email,
              firstName,
              lastName,
              role
            );
            setUser(newUser);
            console.log('✅ Document utilisateur créé dans Firestore');
            // Retourner l'utilisateur créé
            return newUser;
          }
        } catch (loginError: any) {
          // Si la connexion automatique échoue (mauvais mot de passe), lancer l'erreur originale
          console.error('❌ Connexion automatique échouée:', loginError);
          errorMessage = 'Cet email est déjà utilisé. Si c\'est votre compte, veuillez vous connecter.';
        }
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
      console.log('🔓 Déconnexion en cours...');

      // Déconnexion avec Firebase Auth
      await signOut(auth);
      
      // Attendre un peu pour s'assurer que la déconnexion est bien propagée
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // L'état sera mis à jour automatiquement par onAuthStateChanged
      // mais on le fait aussi manuellement pour être sûr
      setUser(null);
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on réinitialise l'utilisateur localement
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedData: Partial<AnyUser>) => {
    if (user) {
      try {
        // Mettre à jour dans Firestore
        await UserService.updateUser(user.id, updatedData);
        
        // Mettre à jour l'état local
        const updatedUser = { ...user, ...updatedData } as AnyUser;
        setUser(updatedUser);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        throw error;
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