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
  onRightPress?: () => void;
};

export default function Header({ 
  title, 
  showBackButton = false, 
  headerRight, 
  rightIcon,
  onRightPress,
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
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
            {rightIcon}
          </TouchableOpacity>
        )}
        {headerRight && headerRight()}
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
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    paddingHorizontal: 10,
  },
  rightContainer: {
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  rightButton: {
    padding: 4,
  },
});