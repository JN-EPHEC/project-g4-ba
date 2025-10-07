import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MonComponent() {
  return (
    <View style={styles.container}>
      <Text>Mon composant fonctionne !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

