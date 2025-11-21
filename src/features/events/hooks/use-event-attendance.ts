import { useState, useEffect } from 'react';
import { EventAttendance, AttendanceStatus } from '@/types';
import { EventAttendanceService } from '../services/event-attendance-service';
import { useAuth } from '@/context/auth-context';

export function useEventAttendance(eventId: string) {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<EventAttendance[]>([]);
  const [userAttendance, setUserAttendance] = useState<EventAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadAttendances();
  }, [eventId, user]);

  const loadAttendances = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const eventAttendances = await EventAttendanceService.getAttendanceByEvent(eventId);
      setAttendances(eventAttendances);

      // Trouver l'inscription de l'utilisateur actuel
      if (user?.id) {
        const myAttendance = eventAttendances.find(
          (att) => att.scoutId === user.id
        );
        setUserAttendance(myAttendance || null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des inscriptions:', err);
      setError('Impossible de charger les inscriptions');
    } finally {
      setLoading(false);
    }
  };

  const registerAttendance = async () => {
    if (!user?.id || !eventId) return;

    try {
      setRegistering(true);
      setError(null);

      const newAttendance = await EventAttendanceService.registerAttendance(
        eventId,
        user.id,
        AttendanceStatus.PENDING
      );

      setUserAttendance(newAttendance);
      setAttendances([...attendances, newAttendance]);
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError('Impossible de s\'inscrire à l\'événement');
    } finally {
      setRegistering(false);
    }
  };

  const cancelAttendance = async () => {
    if (!userAttendance) return;

    try {
      setRegistering(true);
      setError(null);

      await EventAttendanceService.declineAttendance(userAttendance.id);

      setUserAttendance(null);
      setAttendances(attendances.filter((att) => att.id !== userAttendance.id));
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      setError('Impossible d\'annuler l\'inscription');
    } finally {
      setRegistering(false);
    }
  };

  const toggleAttendance = async () => {
    if (userAttendance) {
      await cancelAttendance();
    } else {
      await registerAttendance();
    }
  };

  const isRegistered = !!userAttendance;
  const participantCount = attendances.length;

  return {
    attendances,
    userAttendance,
    isRegistered,
    participantCount,
    loading,
    error,
    registering,
    registerAttendance,
    cancelAttendance,
    toggleAttendance,
    refetch: loadAttendances,
  };
}
