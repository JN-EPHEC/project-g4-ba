import { useState, useEffect, useCallback } from 'react';
import { HealthRecord, HealthRecordInput } from '@/types';
import { HealthService } from '@/services/health-service';

interface UseHealthRecordResult {
  healthRecord: HealthRecord | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  updateRecord: (data: HealthRecordInput) => Promise<void>;
  signRecord: (parentId: string, parentName: string) => Promise<void>;
}

export function useHealthRecord(
  scoutId: string | undefined,
  currentUserId: string | undefined
): UseHealthRecordResult {
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealthRecord = useCallback(async () => {
    if (!scoutId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const record = await HealthService.getHealthRecord(scoutId);
      setHealthRecord(record);
    } catch (err) {
      console.error('Erreur lors du chargement de la fiche santé:', err);
      setError('Impossible de charger la fiche santé');
    } finally {
      setLoading(false);
    }
  }, [scoutId]);

  useEffect(() => {
    loadHealthRecord();
  }, [loadHealthRecord]);

  const updateRecord = useCallback(
    async (data: HealthRecordInput) => {
      if (!scoutId || !currentUserId) {
        throw new Error('Scout ID et User ID requis');
      }

      try {
        setError(null);
        await HealthService.upsertHealthRecord(scoutId, data, currentUserId);
        await loadHealthRecord();
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la fiche santé:', err);
        setError('Impossible de mettre à jour la fiche santé');
        throw err;
      }
    },
    [scoutId, currentUserId, loadHealthRecord]
  );

  const signRecord = useCallback(
    async (parentId: string, parentName: string) => {
      if (!scoutId) {
        throw new Error('Scout ID requis');
      }

      try {
        setError(null);
        await HealthService.signHealthRecord(scoutId, parentId, parentName);
        await loadHealthRecord();
      } catch (err) {
        console.error('Erreur lors de la signature de la fiche santé:', err);
        setError('Impossible de signer la fiche santé');
        throw err;
      }
    },
    [scoutId, loadHealthRecord]
  );

  return {
    healthRecord,
    loading,
    error,
    reload: loadHealthRecord,
    updateRecord,
    signRecord,
  };
}
