import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  headerRight?: () => React.ReactNode;
  rightIcon?: React.ReactNode;
};

export default function Header({ 
  title, 
  showBackButton = false, 
  headerRight, 
  rightIcon,
}: HeaderProps) {
  const { fromWorkoutId } = useLocalSearchParams<{ fromWorkoutId?: string }>();
  console.log(fromWorkoutId)
  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.rightContainer}>
        {rightIcon && (
          <TouchableOpacity onPress={() => router.back()} style={styles.rightButton}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      <View style={{ width: 24 }}>
        {headerRight ? headerRight() : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  leftContainer: {
    width: 40,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    flex: 1,
  },
  rightContainer: {
    width: 15,
    alignItems: 'flex-end',
  },
  rightButton: {
    padding: 4,
  },
});