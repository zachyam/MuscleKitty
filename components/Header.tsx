import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/Colors';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
};

export default function Header({ 
  title, 
  showBackButton = false, 
  rightIcon, 
  onRightPress 
}: HeaderProps) {
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
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
    width: 80,
    alignItems: 'flex-end',
  },
  rightButton: {
    padding: 4,
  },
});