import React, { useState, useEffect } from 'react';
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
import SocialButton from '@/components/SocialButton';
import Colors from '@/constants/Colors';
import { loginWithGoogle, loginWithFacebook, isAuthenticated } from '@/utils/auth';
import { useUser } from '@/utils/UserContext';

export default function LoginScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  
  // Get user context
  const { setUser } = useUser();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        console.log('Login screen: checking authentication');
        const authenticated = await isAuthenticated();
        console.log('Login screen: auth result', authenticated);
        if (authenticated) {
          // AuthProvider in _layout.tsx will handle proper redirection
          // based on whether this is a first-time login
        }
      } catch (error) {
        console.error('Login screen: auth check error', error);
      }
    };
    
    checkAuth();
  }, []);
  
  
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    try {
      const response = await loginWithGoogle();
      
      if (response.error) {
        // Handle error (could show a toast here)
        console.error(response.error);
      } else {
        // Save user to context
        setUser(response.user);
        
        // Router will handle redirect based on first login status
        // The AuthProvider in _layout.tsx will decide whether to go to onboarding or tabs
      }
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    
    try {
      const response = await loginWithFacebook();
      
      if (response.error) {
        // Handle error (could show a toast here)
        console.error(response.error);
      } else {
        // Save user to context
        setUser(response.user);
        
        // Router will handle redirect based on first login status
        // The AuthProvider in _layout.tsx will decide whether to go to onboarding or tabs
      }
    } catch (error) {
      console.error('Facebook login error:', error);
    } finally {
      setFacebookLoading(false);
    }
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
          <View style={styles.header}>
            <Image 
              source={{ uri: 'https://cdn.dribbble.com/userupload/9328318/file/original-372a31363e584305d2763f4f50becddd.jpg' }}
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.title}>Welcome to MuscleKitty</Text>
            <Text style={styles.subtitle}>Continue with a social account</Text>
          </View>
          
          <View style={styles.socialButtons}>
            <SocialButton
              provider="google"
              onPress={handleGoogleLogin}
              isLoading={googleLoading}
            />
            
            <SocialButton
              provider="facebook"
              onPress={handleFacebookLogin}
              isLoading={facebookLoading}
            />
            
            <Text style={styles.socialNote}>
              Choose a social login method to continue
            </Text>
          </View>
          
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>By continuing, you agree to our </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> and </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Privacy Policy</Text>
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
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray,
    textAlign: 'center',
  },
  socialButtons: {
    marginTop: 48,
    marginBottom: 36,
    gap: 20,
  },
  socialNote: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    color: Colors.gray,
    fontSize: 12,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  }
});