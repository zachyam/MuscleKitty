import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInputProps,
  ViewStyle
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  containerStyle,
  ...props
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error ? styles.inputError : null
      ]}>
        {icon && (
          <Feather 
            name={icon} 
            size={18} 
            color={error ? Colors.error : isFocused ? Colors.primary : Colors.gray} 
            style={styles.icon} 
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.gray}
          secureTextEntry={isPassword && !passwordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Feather 
              name={passwordVisible ? "eye-off" : "eye"} 
              size={18} 
              color={Colors.gray} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});

export default FormInput;