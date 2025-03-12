import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Award, Calendar, Dumbbell, LogOut } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { useState, useEffect, useContext } from 'react';

export default function FriendsScreen() {
  
  useEffect(() => {
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Profile"
        rightIcon={<Settings size={24} color={Colors.text} />}
        onRightPress={() => {}}
      />
      
      
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bottomSafeArea: {
    backgroundColor: Colors.background,
  },
  
});