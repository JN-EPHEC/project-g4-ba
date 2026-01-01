/**
 * Constantes d'animation - Style Apple
 * Animations fluides, subtiles et professionnelles
 */

import { Easing } from 'react-native-reanimated';

/**
 * Courbes d'accélération (easing)
 */
export const EASING = {
  // Courbe Apple standard - fluide et naturelle
  apple: Easing.bezier(0.25, 0.1, 0.25, 1.0),

  // Courbe avec léger rebond - pour les interactions
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1),

  // Courbe d'entrée rapide
  easeOut: Easing.bezier(0.0, 0.0, 0.2, 1.0),

  // Courbe de sortie rapide
  easeIn: Easing.bezier(0.4, 0.0, 1.0, 1.0),

  // Courbe symétrique
  easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1.0),
};

/**
 * Configuration des ressorts (springs)
 */
export const SPRING_CONFIG = {
  // Ressort Apple standard - réactif et fluide
  apple: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Ressort doux - pour les grandes transitions
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },

  // Ressort vif - pour les micro-interactions
  snappy: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
  },

  // Ressort rebondissant - pour les célébrations
  bouncy: {
    damping: 8,
    stiffness: 180,
    mass: 1,
  },
};

/**
 * Durées d'animation (en ms)
 */
export const DURATION = {
  // Instantané - feedback immédiat
  instant: 100,

  // Rapide - micro-interactions
  fast: 150,

  // Normal - transitions standard
  normal: 250,

  // Lent - transitions importantes
  slow: 400,

  // Très lent - animations complexes
  slower: 600,
};

/**
 * Délais pour les animations en cascade (stagger)
 */
export const STAGGER = {
  // Délai très court entre items
  fast: 30,

  // Délai standard
  normal: 50,

  // Délai plus long pour effet dramatique
  slow: 80,
};

/**
 * Valeurs de scale pour les interactions
 */
export const SCALE = {
  // Scale subtil style Apple pour les cartes
  pressed: 0.98,

  // Scale pour les boutons
  buttonPressed: 0.95,

  // Scale pour les petits éléments
  smallPressed: 0.92,

  // Scale légèrement agrandi (hover effect)
  hover: 1.02,
};

/**
 * Valeurs d'opacité
 */
export const OPACITY = {
  // Opacité au press
  pressed: 0.8,

  // Opacité désactivé
  disabled: 0.5,

  // Opacité pour overlay
  overlay: 0.3,
};

/**
 * Distances de translation pour les entrées
 */
export const TRANSLATE = {
  // Petite distance - micro-animations
  small: 8,

  // Distance standard - entrées de cards
  normal: 16,

  // Grande distance - transitions d'écran
  large: 24,

  // Très grande - slides complets
  xlarge: 40,
};
