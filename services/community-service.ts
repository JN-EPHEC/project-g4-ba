import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Post {
  id: string;
  content: string;
  authorId: string;
  unitId: string;
  imageUrls?: string[];
  createdAt: Date;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  authorId: string;
  unitId: string;
  createdAt: Date;
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionIndex: number;
  createdAt: Date;
}

export class CommunityService {
  private static readonly POSTS_COLLECTION = 'posts';
  private static readonly POLLS_COLLECTION = 'polls';
  private static readonly POLL_VOTES_COLLECTION = 'pollVotes';

  static async createPost(
    content: string,
    authorId: string,
    unitId: string,
    imageUrls?: string[]
  ): Promise<Post> {
    const postData = {
      content,
      authorId,
      unitId,
      imageUrls: imageUrls || [],
      createdAt: Timestamp.fromDate(new Date()),
    };
    const postRef = doc(collection(db, this.POSTS_COLLECTION));
    await setDoc(postRef, postData);
    return { id: postRef.id, ...postData, createdAt: postData.createdAt.toDate() };
  }

  static async getPostsByUnit(unitId: string): Promise<Post[]> {
    const q = query(
      collection(db, this.POSTS_COLLECTION),
      where('unitId', '==', unitId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Post[];
  }

  static async createPoll(
    question: string,
    options: string[],
    authorId: string,
    unitId: string
  ): Promise<Poll> {
    const pollData = {
      question,
      options,
      authorId,
      unitId,
      createdAt: Timestamp.fromDate(new Date()),
    };
    const pollRef = doc(collection(db, this.POLLS_COLLECTION));
    await setDoc(pollRef, pollData);
    return { id: pollRef.id, ...pollData, createdAt: pollData.createdAt.toDate() };
  }

  static async votePoll(
    pollId: string,
    userId: string,
    optionIndex: number
  ): Promise<PollVote> {
    const voteData = {
      pollId,
      userId,
      optionIndex,
      createdAt: Timestamp.fromDate(new Date()),
    };
    const voteRef = doc(collection(db, this.POLL_VOTES_COLLECTION));
    await setDoc(voteRef, voteData);
    return { id: voteRef.id, ...voteData, createdAt: voteData.createdAt.toDate() };
  }
}

