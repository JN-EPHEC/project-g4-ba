import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Album {
  id: string;
  title: string;
  description?: string;
  unitId: string;
  createdBy: string;
  createdAt: Date;
}

export interface AlbumPhoto {
  id: string;
  albumId: string;
  imageUrl: string;
  caption?: string;
  uploadedBy: string;
  createdAt: Date;
}

export class AlbumService {
  private static readonly ALBUMS_COLLECTION = 'albums';
  private static readonly PHOTOS_COLLECTION = 'albumPhotos';

  static async createAlbum(
    title: string,
    unitId: string,
    createdBy: string,
    description?: string
  ): Promise<Album> {
    const albumData = {
      title,
      description,
      unitId,
      createdBy,
      createdAt: Timestamp.fromDate(new Date()),
    };
    const albumRef = doc(collection(db, this.ALBUMS_COLLECTION));
    await setDoc(albumRef, albumData);
    return { id: albumRef.id, ...albumData, createdAt: albumData.createdAt.toDate() };
  }

  static async addPhotoToAlbum(
    albumId: string,
    imageUrl: string,
    uploadedBy: string,
    caption?: string
  ): Promise<AlbumPhoto> {
    const photoData = {
      albumId,
      imageUrl,
      caption,
      uploadedBy,
      createdAt: Timestamp.fromDate(new Date()),
    };
    const photoRef = doc(collection(db, this.PHOTOS_COLLECTION));
    await setDoc(photoRef, photoData);
    return { id: photoRef.id, ...photoData, createdAt: photoData.createdAt.toDate() };
  }

  static async getAlbumsByUnit(unitId: string): Promise<Album[]> {
    const q = query(
      collection(db, this.ALBUMS_COLLECTION),
      where('unitId', '==', unitId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Album[];
  }

  static async getPhotosByAlbum(albumId: string): Promise<AlbumPhoto[]> {
    const q = query(
      collection(db, this.PHOTOS_COLLECTION),
      where('albumId', '==', albumId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as AlbumPhoto[];
  }
}

