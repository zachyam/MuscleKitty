import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FormInput from '@/components/FormInput';
import PrimaryButton from '@/components/PrimaryButton';
import SocialButton from '@/components/SocialButton';
import Colors from '@/constants/Colors';
import { signUpWithEmail, loginWithGoogle, loginWithFacebook } from '@/utils/auth';
import { useUser } from '@/utils/UserContext';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  
  // Get user context
  const { setUser } = useUser();
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Name validation
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };
  
  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await signUpWithEmail(email, password, name);
      
      if (response.error) {
        // Handle error
        setEmailError(response.error);
      } else {
        // Save user to context
        setUser(response.user);
        
        // Navigate to home screen
        router.navigate('/(tabs)');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    
    try {
      const response = await loginWithGoogle();
      
      if (response.error) {
        console.error(response.error);
      } else {
        // Save user to context
        setUser(response.user);
        
        router.navigate('/(tabs)');
      }
    } catch (error) {
      console.error('Google signup error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleFacebookSignUp = async () => {
    setFacebookLoading(true);
    
    try {
      const response = await loginWithFacebook();
      
      if (response.error) {
        console.error(response.error);
      } else {
        // Save user to context
        setUser(response.user);
        
        router.navigate('/(tabs)');
      }
    } catch (error) {
      console.error('Facebook signup error:', error);
    } finally {
      setFacebookLoading(false);
    }
  };
  
  const navigateToLogin = () => {
    router.push('/login');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
        
          <View style={styles.header}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>
          
          <View style={styles.form}>
            <FormInput
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={nameError}
              icon="user"
              autoComplete="name"
            />
            
            <FormInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              icon="mail"
              autoComplete="email"
            />
            
            <FormInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={passwordError}
              icon="lock"
              isPassword
              autoComplete="password-new"
            />
            
            <FormInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={confirmPasswordError}
              icon="lock"
              isPassword
              autoComplete="password-new"
            />
            
            <PrimaryButton
              label="Create Account"
              onPress={handleSignUp}
              isLoading={isLoading}
              style={styles.signUpButton}
            />
          </View>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.socialButtons}>
            <SocialButton
              provider="google"
              onPress={handleGoogleSignUp}
              isLoading={googleLoading}
            />
            
            <SocialButton
              provider="facebook"
              onPress={handleFacebookSignUp}
              isLoading={facebookLoading}
            />
            
            <Text style={styles.socialNote}>
              Note: Make sure Google/Facebook providers are enabled in your Supabase dashboard
            </Text>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
  },
  form: {
    marginBottom: 24,
  },
  signUpButton: {
    width: '100%',
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.gray,
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    marginBottom: 32,
    gap: 12,
  },
  socialNote: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    color: Colors.gray,
  },
  loginText: {
    color: Colors.primary,
    fontWeight: '600',
  }
});