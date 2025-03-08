import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import Colors from '@/constants/Colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  label, 
  onPress, 
  isLoading = false, 
  disabled = false,
  style,
  textStyle,
  variant = 'primary'
}) => {
  
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };
  
  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.buttonText;
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        getButtonStyle(), 
        (disabled || isLoading) && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? Colors.primary : 'white'} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrimaryButton;