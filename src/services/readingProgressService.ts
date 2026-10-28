/**
 * MangaWild Reading Progress & Firestore Database Sync Service
 * Manages chapter progress tracking, panel bookmarks, and real-time cloud synchronization.
 */

import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { StorageService } from './storage';
import { ReadingHistoryItem } from '../types/manga';

export const READING_PROGRESS_EVENT = 'mangawild_reading_progress_updated';

class ReadingProgressService {
  /**
   * Save reading progress locally and sync to Firestore
   */
  async saveProgress(userId: string, item: ReadingHistoryItem): Promise<void> {
    const total = Math.max(item.totalPanels || 1, 1);
    const panel = Math.min(Math.max(item.panelIndex || 1, 1), total);
    const progressPercent = item.progressPercent ?? Math.min(100, Math.round((panel / total) * 100));
    const isCompleted = item.isCompleted ?? (panel >= total || progressPercent >= 95);

    const enrichedItem: ReadingHistoryItem = {
      ...item,
      panelIndex: panel,
      totalPanels: total,
      progressPercent,
      isCompleted,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };

    // 1. Immediately persist to localStorage for instant UI feedback
    StorageService.saveReadingProgress(userId, enrichedItem);

    // 2. Dispatch custom event for real-time reactivity across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(READING_PROGRESS_EVENT, {
          detail: { userId, item: enrichedItem },
        })
      );
    }

    // 3. Sync to Firestore if user is authenticated with Firebase
    const currentUid = auth.currentUser?.uid || (userId.startsWith('user_') ? null : userId);
    if (!currentUid) {
      return;
    }

    const docPath = `users/${currentUid}/reading_progress/${enrichedItem.seriesId}`;
    try {
      const docRef = doc(db, 'users', currentUid, 'reading_progress', enrichedItem.seriesId);
      await setDoc(
        docRef,
        {
          id: enrichedItem.seriesId,
          userId: currentUid,
          seriesId: enrichedItem.seriesId,
          chapterId: enrichedItem.chapterId,
          chapterNumber: enrichedItem.chapterNumber,
          chapterTitle: enrichedItem.chapterTitle || '',
          panelIndex: enrichedItem.panelIndex,
          totalPanels: enrichedItem.totalPanels,
          progressPercent: enrichedItem.progressPercent,
          isCompleted: enrichedItem.isCompleted,
          updatedAt: enrichedItem.updatedAt,
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('Firestore progress sync notice (saved locally):', err?.message || err);
      // We do not throw to ensure reader UX is never interrupted
    }
  }

  /**
   * Get progress for a specific series
   */
  getProgress(userId: string, seriesId: string): ReadingHistoryItem | undefined {
    const list = StorageService.getReadingHistory(userId);
    return list.find(h => h.seriesId === seriesId);
  }

  /**
   * Sync all reading progress from Firestore into local cache
   */
  async syncFromFirestore(userId: string): Promise<ReadingHistoryItem[]> {
    const localHistory = StorageService.getReadingHistory(userId);
    const currentUid = auth.currentUser?.uid || (userId.startsWith('user_') ? null : userId);
    
    if (!currentUid) {
      return localHistory;
    }

    const collPath = `users/${currentUid}/reading_progress`;
    try {
      const collRef = collection(db, 'users', currentUid, 'reading_progress');
      const snap = await getDocs(collRef);
      
      if (snap.empty) {
        // If Firestore is empty but local has items, push local items to Firestore
        for (const item of localHistory) {
          this.saveProgress(currentUid, item).catch(() => {});
        }
        return localHistory;
      }

      const remoteItems: ReadingHistoryItem[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.seriesId && data.chapterId) {
          remoteItems.push({
            seriesId: data.seriesId,
            chapterId: data.chapterId,
            chapterNumber: Number(data.chapterNumber) || 1,
            chapterTitle: data.chapterTitle || undefined,
            panelIndex: Number(data.panelIndex) || 1,
            totalPanels: Number(data.totalPanels) || 1,
            progressPercent: Number(data.progressPercent) || Math.round((Number(data.panelIndex || 1) / Math.max(Number(data.totalPanels || 1), 1)) * 100),
            isCompleted: Boolean(data.isCompleted),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }
      });

      // Merge remote and local (most recently updated takes precedence)
      const mergedMap = new Map<string, ReadingHistoryItem>();
      for (const item of localHistory) {
        mergedMap.set(item.seriesId, item);
      }

      for (const remote of remoteItems) {
        const existing = mergedMap.get(remote.seriesId);
        if (!existing) {
          mergedMap.set(remote.seriesId, remote);
        } else {
          const remoteTime = new Date(remote.updatedAt).getTime();
          const localTime = new Date(existing.updatedAt).getTime();
          if (remoteTime >= localTime) {
            mergedMap.set(remote.seriesId, remote);
          }
        }
      }

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Save merged history to local storage
      for (const item of mergedList) {
        StorageService.saveReadingProgress(userId, item);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(READING_PROGRESS_EVENT, {
            detail: { userId, items: mergedList },
          })
        );
      }

      return mergedList;
    } catch (err: any) {
      console.warn('Could not sync reading progress from Firestore:', err?.message || err);
      return localHistory;
    }
  }
}

export const readingProgressService = new ReadingProgressService();
