import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type SocialButtonProps = {
  provider: 'google' | 'facebook' | 'apple';
  onPress: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
};

const SocialButton: React.FC<SocialButtonProps> = ({ 
  provider, 
  onPress, 
  isLoading = false,
  style
}) => {
  const getIcon = () => {
    switch (provider) {
      case 'google':
        return 'google';
      case 'facebook':
        return 'facebook-square';
      case 'apple':
        return 'apple1';
    }
  };

  const getLabel = () => {
    switch (provider) {
      case 'google':
        return 'Continue with Google';
      case 'facebook':
        return 'Continue with Facebook';
      case 'apple':
        return 'Continue with Apple';
    }
  };

  const getColor = () => {
    switch (provider) {
      case 'google':
        return '#DB4437';
      case 'facebook':
        return '#4267B2';
      case 'apple':
        return '#000000';
    }
  };
  
  const icon = getIcon();
  const label = getLabel();
  const color = getColor();
  
  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: color }, style]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          <AntDesign name={icon} size={20} color={color} style={styles.icon} />
          <Text style={[styles.label, { color }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'white',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  }
});

export default SocialButton;