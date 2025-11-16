/**
 * Service pour la gestion des utilisateurs dans Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AnyUser, UserRole, Scout, Parent, Animator } from '@/types';

const USERS_COLLECTION = 'users';

/**
 * Créer un nouvel utilisateur dans Firestore
 */
export const createUser = async (
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole
): Promise<AnyUser> => {
  const baseUser = {
    id: uid,
    email,
    firstName,
    lastName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let userData: AnyUser;

  switch (role) {
    case UserRole.SCOUT:
      userData = {
        ...baseUser,
        role: UserRole.SCOUT,
        parentIds: [],
        unitId: '',
        points: 0,
        dateOfBirth: new Date(),
      } as Scout;
      break;
    case UserRole.PARENT:
      userData = {
        ...baseUser,
        role: UserRole.PARENT,
        scoutIds: [],
      } as Parent;
      break;
    case UserRole.ANIMATOR:
      userData = {
        ...baseUser,
        role: UserRole.ANIMATOR,
        unitId: '',
        isUnitLeader: false,
      } as Animator;
      break;
    default:
      throw new Error('Invalid role');
  }

  // Sauvegarder dans Firestore
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    ...userData,
    createdAt: userData.createdAt.toISOString(),
    updatedAt: userData.updatedAt.toISOString(),
    ...(role === UserRole.SCOUT && {
      dateOfBirth: (userData as Scout).dateOfBirth.toISOString(),
    }),
  });

  return userData;
};

/**
 * Récupérer un utilisateur depuis Firestore
 */
export const getUser = async (uid: string): Promise<AnyUser | null> => {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();

  // Convertir les dates ISO en objets Date
  const user = {
    ...data,
    id: userDoc.id,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    ...(data.role === UserRole.SCOUT && {
      dateOfBirth: new Date(data.dateOfBirth),
    }),
  } as AnyUser;

  return user;
};

/**
 * Mettre à jour un utilisateur dans Firestore
 */
export const updateUser = async (
  uid: string,
  updates: Partial<AnyUser>
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, uid);

  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Récupérer les scouts d'un parent
 */
export const getParentScouts = async (parentId: string): Promise<Scout[]> => {
  const parent = await getUser(parentId) as Parent;

  if (!parent || parent.role !== UserRole.PARENT) {
    return [];
  }

  const scouts: Scout[] = [];
  for (const scoutId of parent.scoutIds) {
    const scout = await getUser(scoutId);
    if (scout && scout.role === UserRole.SCOUT) {
      scouts.push(scout as Scout);
    }
  }

  return scouts;
};

/**
 * Récupérer les scouts d'une unité
 */
export const getUnitScouts = async (unitId: string): Promise<Scout[]> => {
  const scoutsQuery = query(
    collection(db, USERS_COLLECTION),
    where('role', '==', UserRole.SCOUT),
    where('unitId', '==', unitId)
  );

  const querySnapshot = await getDocs(scoutsQuery);
  const scouts: Scout[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    scouts.push({
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      dateOfBirth: new Date(data.dateOfBirth),
    } as Scout);
  });

  return scouts;
};

/**
 * Lier un scout à un parent
 */
export const linkScoutToParent = async (
  scoutId: string,
  parentId: string
): Promise<void> => {
  const scout = await getUser(scoutId) as Scout;
  const parent = await getUser(parentId) as Parent;

  if (!scout || scout.role !== UserRole.SCOUT) {
    throw new Error('Scout not found');
  }

  if (!parent || parent.role !== UserRole.PARENT) {
    throw new Error('Parent not found');
  }

  // Ajouter le parent à la liste des parents du scout
  if (!scout.parentIds.includes(parentId)) {
    await updateUser(scoutId, {
      parentIds: [...scout.parentIds, parentId],
    });
  }

  // Ajouter le scout à la liste des scouts du parent
  if (!parent.scoutIds.includes(scoutId)) {
    await updateUser(parentId, {
      scoutIds: [...parent.scoutIds, scoutId],
    });
  }
};
