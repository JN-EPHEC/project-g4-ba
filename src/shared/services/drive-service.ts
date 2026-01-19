import { db, storage } from '@/config/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import {
  type StorageFolder,
  type StorageFile,
  FolderCategory,
  FOLDER_ICONS,
  getFileTypeFromMime,
  PhotoSubcategory,
  PHOTO_SUBCATEGORY_LABELS,
  PHOTO_SUBCATEGORY_ICONS,
} from '@/src/shared/types/document';

/**
 * Service pour gérer le stockage de documents (Drive)
 */
export class DriveService {
  private static readonly FOLDERS_COLLECTION = 'storageFolders';
  private static readonly FILES_COLLECTION = 'storageFiles';

  /**
   * Convertit un document Firestore en StorageFolder
   */
  private static convertFolder(data: DocumentData): StorageFolder {
    return {
      id: data.id,
      name: data.name,
      category: data.category as FolderCategory,
      description: data.description,
      icon: data.icon || FOLDER_ICONS[data.category as FolderCategory],
      unitId: data.unitId,
      parentId: data.parentId,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Convertit un document Firestore en StorageFile
   */
  private static convertFile(data: DocumentData): StorageFile {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      folderId: data.folderId,
      unitId: data.unitId,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      mimeType: data.mimeType,
      size: data.size,
      uploadedBy: data.uploadedBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Crée les dossiers par défaut pour une unité
   */
  static async ensureDefaultFolders(unitId: string, createdBy: string): Promise<void> {
    try {
      // Vérifier si des dossiers existent déjà
      const existingFolders = await this.getFolders(unitId);
      if (existingFolders.length > 0) {
        console.log('[Drive] Dossiers existants, pas de création');
        // Vérifier si le dossier Photos a ses sous-dossiers
        const photosFolder = existingFolders.find(f => f.category === FolderCategory.PHOTOS);
        if (photosFolder) {
          await this.ensurePhotoSubfolders(photosFolder.id, unitId, createdBy);
        }
        return;
      }

      const defaultCategories = [
        FolderCategory.ADMINISTRATIVE,
        FolderCategory.ACTIVITIES,
        FolderCategory.PHOTOS,
        FolderCategory.PLANNING,
        FolderCategory.RESOURCES,
      ];

      const now = new Date();

      for (const category of defaultCategories) {
        const folderData = {
          name: this.getCategoryName(category),
          category,
          icon: FOLDER_ICONS[category],
          unitId,
          createdBy,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        };

        const folderRef = doc(collection(db, this.FOLDERS_COLLECTION));
        await setDoc(folderRef, folderData);

        // Créer les sous-dossiers pour Photos
        if (category === FolderCategory.PHOTOS) {
          await this.ensurePhotoSubfolders(folderRef.id, unitId, createdBy);
        }
      }

      console.log('[Drive] Dossiers par défaut créés');
    } catch (error) {
      console.error('[Drive] Erreur création dossiers par défaut:', error);
      throw error;
    }
  }

  /**
   * Crée les sous-dossiers de catégories pour le dossier Photos
   */
  static async ensurePhotoSubfolders(photosFolderId: string, unitId: string, createdBy: string): Promise<void> {
    try {
      // Vérifier si des sous-dossiers existent déjà
      const existingSubfolders = await this.getFolders(unitId, photosFolderId);
      if (existingSubfolders.length > 0) {
        console.log('[Drive] Sous-dossiers Photos existants');
        return;
      }

      const now = new Date();

      for (const subcategory of Object.values(PhotoSubcategory)) {
        const subfolderData = {
          name: PHOTO_SUBCATEGORY_LABELS[subcategory],
          category: FolderCategory.PHOTOS,
          icon: PHOTO_SUBCATEGORY_ICONS[subcategory],
          unitId,
          parentId: photosFolderId,
          createdBy,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        };

        const subfolderRef = doc(collection(db, this.FOLDERS_COLLECTION));
        await setDoc(subfolderRef, subfolderData);
      }

      console.log('[Drive] Sous-dossiers Photos créés');
    } catch (error) {
      console.error('[Drive] Erreur création sous-dossiers Photos:', error);
      throw error;
    }
  }

  /**
   * Retourne le nom français d'une catégorie
   */
  private static getCategoryName(category: FolderCategory): string {
    const names: Record<FolderCategory, string> = {
      [FolderCategory.ADMINISTRATIVE]: 'Administratif',
      [FolderCategory.ACTIVITIES]: 'Activités',
      [FolderCategory.PHOTOS]: 'Photos',
      [FolderCategory.PLANNING]: 'Planning',
      [FolderCategory.RESOURCES]: 'Ressources',
      [FolderCategory.OTHER]: 'Autres',
    };
    return names[category];
  }

  /**
   * Récupère tous les dossiers d'une unité
   */
  static async getFolders(unitId: string, parentId?: string): Promise<StorageFolder[]> {
    try {
      let q;
      if (parentId) {
        q = query(
          collection(db, this.FOLDERS_COLLECTION),
          where('unitId', '==', unitId),
          where('parentId', '==', parentId),
          orderBy('name')
        );
      } else {
        q = query(
          collection(db, this.FOLDERS_COLLECTION),
          where('unitId', '==', unitId),
          orderBy('name')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => this.convertFolder({ id: doc.id, ...doc.data() }))
        .filter((folder) => parentId ? folder.parentId === parentId : !folder.parentId);
    } catch (error) {
      console.error('[Drive] Erreur récupération dossiers:', error);
      throw error;
    }
  }

  /**
   * Récupère un dossier par son ID
   */
  static async getFolderById(folderId: string): Promise<StorageFolder | null> {
    try {
      const folderDoc = await getDoc(doc(db, this.FOLDERS_COLLECTION, folderId));
      if (!folderDoc.exists()) {
        return null;
      }
      return this.convertFolder({ id: folderDoc.id, ...folderDoc.data() });
    } catch (error) {
      console.error('[Drive] Erreur récupération dossier:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau dossier
   */
  static async createFolder(
    name: string,
    category: FolderCategory,
    unitId: string,
    createdBy: string,
    description?: string,
    parentId?: string
  ): Promise<StorageFolder> {
    try {
      const now = new Date();
      const folderData: Record<string, unknown> = {
        name,
        category,
        icon: FOLDER_ICONS[category],
        unitId,
        createdBy,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (description) {
        folderData.description = description;
      }
      if (parentId) {
        folderData.parentId = parentId;
      }

      const folderRef = doc(collection(db, this.FOLDERS_COLLECTION));
      await setDoc(folderRef, folderData);

      return this.convertFolder({ id: folderRef.id, ...folderData });
    } catch (error) {
      console.error('[Drive] Erreur création dossier:', error);
      throw error;
    }
  }

  /**
   * Met à jour un dossier
   */
  static async updateFolder(
    folderId: string,
    updates: Partial<Pick<StorageFolder, 'name' | 'description' | 'icon'>>
  ): Promise<void> {
    try {
      const folderRef = doc(db, this.FOLDERS_COLLECTION, folderId);
      await updateDoc(folderRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('[Drive] Erreur mise à jour dossier:', error);
      throw error;
    }
  }

  /**
   * Supprime un dossier et tous ses fichiers
   */
  static async deleteFolder(folderId: string): Promise<void> {
    try {
      // Supprimer tous les fichiers du dossier
      const files = await this.getFiles(folderId);
      for (const file of files) {
        await this.deleteFile(file.id);
      }

      // Supprimer les sous-dossiers récursivement
      const folder = await this.getFolderById(folderId);
      if (folder) {
        const subFolders = await this.getFolders(folder.unitId, folderId);
        for (const subFolder of subFolders) {
          await this.deleteFolder(subFolder.id);
        }
      }

      // Supprimer le dossier
      await deleteDoc(doc(db, this.FOLDERS_COLLECTION, folderId));
    } catch (error) {
      console.error('[Drive] Erreur suppression dossier:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les fichiers d'un dossier
   */
  static async getFiles(folderId: string): Promise<StorageFile[]> {
    try {
      const q = query(
        collection(db, this.FILES_COLLECTION),
        where('folderId', '==', folderId),
        orderBy('name')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertFile({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('[Drive] Erreur récupération fichiers:', error);
      throw error;
    }
  }

  /**
   * Récupère un fichier par son ID
   */
  static async getFileById(fileId: string): Promise<StorageFile | null> {
    try {
      const fileDoc = await getDoc(doc(db, this.FILES_COLLECTION, fileId));
      if (!fileDoc.exists()) {
        return null;
      }
      return this.convertFile({ id: fileDoc.id, ...fileDoc.data() });
    } catch (error) {
      console.error('[Drive] Erreur récupération fichier:', error);
      throw error;
    }
  }

  /**
   * Upload un fichier (pour mobile avec URI)
   */
  static async uploadFile(
    localUri: string,
    fileName: string,
    mimeType: string,
    size: number,
    folderId: string,
    unitId: string,
    uploadedBy: string,
    description?: string
  ): Promise<StorageFile> {
    try {
      // Upload vers Firebase Storage
      const timestamp = Date.now();
      const storagePath = `drive/${unitId}/${folderId}/${timestamp}_${fileName}`;
      const storageRef = ref(storage, storagePath);

      const response = await fetch(localUri);
      const fileBlob = await response.blob();

      await uploadBytes(storageRef, fileBlob, { contentType: mimeType });
      const fileUrl = await getDownloadURL(storageRef);

      // Créer l'entrée dans Firestore
      const now = new Date();
      const fileData: Record<string, unknown> = {
        name: fileName,
        folderId,
        unitId,
        fileUrl,
        fileType: getFileTypeFromMime(mimeType),
        mimeType,
        size,
        uploadedBy,
        storagePath, // Garder le path pour la suppression
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Ajouter description seulement si elle existe (Firestore n'accepte pas undefined)
      if (description) {
        fileData.description = description;
      }

      const fileRef = doc(collection(db, this.FILES_COLLECTION));
      await setDoc(fileRef, fileData);

      return this.convertFile({ id: fileRef.id, ...fileData });
    } catch (error) {
      console.error('[Drive] Erreur upload fichier:', error);
      throw error;
    }
  }

  /**
   * Upload un fichier depuis un Blob/File (pour le web)
   */
  static async uploadFileFromBlob(
    fileBlob: Blob | File,
    fileName: string,
    mimeType: string,
    size: number,
    folderId: string,
    unitId: string,
    uploadedBy: string,
    description?: string
  ): Promise<StorageFile> {
    try {
      // Upload vers Firebase Storage
      const timestamp = Date.now();
      const storagePath = `drive/${unitId}/${folderId}/${timestamp}_${fileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, fileBlob, { contentType: mimeType });
      const fileUrl = await getDownloadURL(storageRef);

      // Créer l'entrée dans Firestore
      const now = new Date();
      const fileData: Record<string, unknown> = {
        name: fileName,
        folderId,
        unitId,
        fileUrl,
        fileType: getFileTypeFromMime(mimeType),
        mimeType,
        size,
        uploadedBy,
        storagePath, // Garder le path pour la suppression
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      // Ajouter description seulement si elle existe (Firestore n'accepte pas undefined)
      if (description) {
        fileData.description = description;
      }

      const fileRef = doc(collection(db, this.FILES_COLLECTION));
      await setDoc(fileRef, fileData);

      return this.convertFile({ id: fileRef.id, ...fileData });
    } catch (error) {
      console.error('[Drive] Erreur upload fichier (blob):', error);
      throw error;
    }
  }

  /**
   * Met à jour les métadonnées d'un fichier
   */
  static async updateFile(
    fileId: string,
    updates: Partial<Pick<StorageFile, 'name' | 'description'>>
  ): Promise<void> {
    try {
      const fileRef = doc(db, this.FILES_COLLECTION, fileId);
      await updateDoc(fileRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('[Drive] Erreur mise à jour fichier:', error);
      throw error;
    }
  }

  /**
   * Supprime un fichier
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        throw new Error('Fichier non trouvé');
      }

      // Récupérer le path de stockage depuis Firestore
      const fileDoc = await getDoc(doc(db, this.FILES_COLLECTION, fileId));
      const storagePath = fileDoc.data()?.storagePath;

      // Supprimer du Storage si le path existe
      if (storagePath) {
        try {
          const storageRef = ref(storage, storagePath);
          await deleteObject(storageRef);
        } catch (e) {
          console.warn('[Drive] Fichier Storage introuvable:', e);
        }
      }

      // Supprimer l'entrée Firestore
      await deleteDoc(doc(db, this.FILES_COLLECTION, fileId));
    } catch (error) {
      console.error('[Drive] Erreur suppression fichier:', error);
      throw error;
    }
  }

  /**
   * Recherche des fichiers par nom
   */
  static async searchFiles(unitId: string, searchTerm: string): Promise<StorageFile[]> {
    try {
      // Firebase ne supporte pas la recherche partielle, on récupère tous les fichiers et on filtre
      const q = query(
        collection(db, this.FILES_COLLECTION),
        where('unitId', '==', unitId)
      );

      const querySnapshot = await getDocs(q);
      const files = querySnapshot.docs.map((doc) =>
        this.convertFile({ id: doc.id, ...doc.data() })
      );

      const lowerSearch = searchTerm.toLowerCase();
      return files.filter(
        (file) =>
          file.name.toLowerCase().includes(lowerSearch) ||
          file.description?.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('[Drive] Erreur recherche fichiers:', error);
      throw error;
    }
  }

  /**
   * Formate la taille d'un fichier pour l'affichage
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
