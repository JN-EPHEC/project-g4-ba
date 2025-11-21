import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { EventService } from '../services/event-service';
import { useAuth } from '@/context/auth-context';

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les événements à venir
      // Si l'utilisateur a une unité, filtrer par unité
      const unitId = user?.unitId;
      const upcomingEvents = await EventService.getUpcomingEvents(unitId);

      setEvents(upcomingEvents);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError('Impossible de charger les événements');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadEvents();
  };

  return {
    events,
    loading,
    error,
    refetch,
  };
}
