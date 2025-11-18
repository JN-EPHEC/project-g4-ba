import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Interface pour un event
interface Event {
  id: string;
  title: string;
  done: boolean;
  createdAt: any;
}

/**
 * Page Firestore CRUD
 * Permet de créer, lire, mettre à jour et supprimer des events
 */
export default function FirestoreScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');

  // Écouter les changements en temps réel de la collection "events"
  useEffect(() => {
    console.log('🔵 Abonnement aux events Firestore...');
    const unsubscribe = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        const eventsData: Event[] = [];
        snapshot.forEach((doc) => {
          eventsData.push({
            id: doc.id,
            ...doc.data(),
          } as Event);
        });

        // Trier par date de création (plus récent en premier)
        eventsData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });

        console.log('✅ Events récupérés:', eventsData.length);
        setEvents(eventsData);
      },
      (error) => {
        console.error('❌ Erreur lors de l\'écoute des events:', error);
        Alert.alert('Erreur', error.message);
      }
    );

    // Nettoyer l'abonnement lors du démontage
    return () => unsubscribe();
  }, []);

  // Ajouter un event
  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }

    try {
      console.log('➕ Ajout d\'un event:', newEventTitle);
      await addDoc(collection(db, 'events'), {
        title: newEventTitle,
        done: false,
        createdAt: serverTimestamp(),
      });

      setNewEventTitle('');
      console.log('✅ Event ajouté avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  // Marquer un event comme fait/non fait
  const handleToggleDone = async (eventId: string, currentDone: boolean) => {
    try {
      console.log('🔄 Mise à jour de l\'event:', eventId);
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        done: !currentDone,
      });
      console.log('✅ Event mis à jour');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  // Supprimer un event
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer "${eventTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Suppression de l\'event:', eventId);
              await deleteDoc(doc(db, 'events', eventId));
              console.log('✅ Event supprimé');
            } catch (error: any) {
              console.error('❌ Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  // Render d'un item
  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Pressable
        style={styles.eventContent}
        onPress={() => handleToggleDone(item.id, item.done)}
      >
        <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
          {item.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.eventTitle, item.done && styles.eventTitleDone]}>
          {item.title}
        </Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDeleteEvent(item.id, item.title)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Firestore CRUD - Events</Text>

        <View style={styles.addSection}>
          <TextInput
            style={styles.input}
            placeholder="Titre du nouvel event..."
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            placeholderTextColor="#999"
          />
          <Pressable style={styles.addButton} onPress={handleAddEvent}>
            <Text style={styles.addButtonText}>Ajouter</Text>
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun event pour le moment</Text>
              <Text style={styles.emptySubText}>
                Ajoutez-en un ci-dessus !
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  addSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listHeader: {
    marginBottom: 10,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 16,
    flex: 1,
  },
  eventTitleDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
  },
});
