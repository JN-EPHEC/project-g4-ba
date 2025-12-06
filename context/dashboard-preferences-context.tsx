import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WidgetId =
  | 'messages'
  | 'activity'
  | 'challenges'
  | 'admin_alerts'
  | 'birthdays'
  | 'weather'
  | 'events'
  | 'stats';

interface DashboardPreferences {
  widgetOrder: WidgetId[];
  hiddenWidgets: WidgetId[];
}

interface DashboardPreferencesContextType {
  preferences: DashboardPreferences;
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  reorderWidgets: (newOrder: WidgetId[]) => void;
  toggleWidgetVisibility: (widgetId: WidgetId) => void;
  isWidgetVisible: (widgetId: WidgetId) => boolean;
  resetToDefaults: () => void;
  getOrderedWidgets: (availableWidgets: WidgetId[]) => WidgetId[];
}

const STORAGE_KEY = '@dashboard_preferences';

// Ordre par défaut des widgets
const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'stats',
  'admin_alerts',
  'messages',
  'activity',
  'challenges',
  'birthdays',
  'weather',
  'events',
];

const DEFAULT_PREFERENCES: DashboardPreferences = {
  widgetOrder: DEFAULT_WIDGET_ORDER,
  hiddenWidgets: [],
};

const DashboardPreferencesContext = createContext<DashboardPreferencesContextType | null>(null);

export function DashboardPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les préférences au démarrage
  useEffect(() => {
    loadPreferences();
  }, []);

  // Sauvegarder les préférences quand elles changent
  useEffect(() => {
    if (isLoaded) {
      savePreferences();
    }
  }, [preferences, isLoaded]);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardPreferences;
        setPreferences({
          widgetOrder: parsed.widgetOrder || DEFAULT_WIDGET_ORDER,
          hiddenWidgets: parsed.hiddenWidgets || [],
        });
      }
    } catch (error) {
      console.error('[DashboardPreferences] Erreur chargement:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('[DashboardPreferences] Erreur sauvegarde:', error);
    }
  };

  const setEditMode = useCallback((enabled: boolean) => {
    setIsEditMode(enabled);
  }, []);

  const reorderWidgets = useCallback((newOrder: WidgetId[]) => {
    setPreferences((prev) => ({
      ...prev,
      widgetOrder: newOrder,
    }));
  }, []);

  const toggleWidgetVisibility = useCallback((widgetId: WidgetId) => {
    setPreferences((prev) => {
      const isHidden = prev.hiddenWidgets.includes(widgetId);
      return {
        ...prev,
        hiddenWidgets: isHidden
          ? prev.hiddenWidgets.filter((id) => id !== widgetId)
          : [...prev.hiddenWidgets, widgetId],
      };
    });
  }, []);

  const isWidgetVisible = useCallback(
    (widgetId: WidgetId) => {
      return !preferences.hiddenWidgets.includes(widgetId);
    },
    [preferences.hiddenWidgets]
  );

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const getOrderedWidgets = useCallback(
    (availableWidgets: WidgetId[]): WidgetId[] => {
      // Filtrer les widgets disponibles selon l'ordre préféré
      const ordered = preferences.widgetOrder.filter(
        (id) => availableWidgets.includes(id) && !preferences.hiddenWidgets.includes(id)
      );

      // Ajouter les widgets disponibles qui ne sont pas dans l'ordre
      const remaining = availableWidgets.filter(
        (id) => !preferences.widgetOrder.includes(id) && !preferences.hiddenWidgets.includes(id)
      );

      return [...ordered, ...remaining];
    },
    [preferences.widgetOrder, preferences.hiddenWidgets]
  );

  return (
    <DashboardPreferencesContext.Provider
      value={{
        preferences,
        isEditMode,
        setEditMode,
        reorderWidgets,
        toggleWidgetVisibility,
        isWidgetVisible,
        resetToDefaults,
        getOrderedWidgets,
      }}
    >
      {children}
    </DashboardPreferencesContext.Provider>
  );
}

export function useDashboardPreferences() {
  const context = useContext(DashboardPreferencesContext);
  if (!context) {
    throw new Error(
      'useDashboardPreferences must be used within DashboardPreferencesProvider'
    );
  }
  return context;
}
