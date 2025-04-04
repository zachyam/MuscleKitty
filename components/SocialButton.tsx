import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type SocialButtonProps = {
  provider: 'google' | 'facebook';
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
  const icon = provider === 'google' ? 'google' : 'facebook';
  const label = provider === 'google' ? 'Continue with Google' : 'Continue with Facebook';
  const color = provider === 'google' ? '#DB4437' : '#4267B2';
  
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
          {provider === 'google' ? (
            <AntDesign name="google" size={20} color={color} style={styles.icon} />
          ) : (
            <AntDesign name="facebook-square" size={20} color={color} style={styles.icon} />
          )}
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