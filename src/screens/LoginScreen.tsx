// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';
import { useToast } from '../components/ToastContext';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [accountInput, setAccountInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { showToast } = useToast();
  
  // 🔐 Login လုပ်ငန်းစဉ်ကို ကိုင်တွယ်မည့် Function
  const handleLogin = async () => {
    if (!accountInput.trim() || !password) {
      return showToast('Please fill in all fields.', 'info');
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        accountInput: accountInput.trim(),
        password: password
      });
      
      const { user, token } = response.data;
      
      // Memory Storage ထဲတွင် သိမ်းဆည်းခြင်း
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);

      // ပင်မ Home Screen သို့ လမ်းကြောင်းအစားထိုး ဝင်ရောက်ခြင်း
      navigation.replace('Home', { user, token });
    } catch (error: any) {
      const errorData = error.response?.data;
      
      // အကောင့်က OTP Verify မဖြစ်သေးပါက အလိုအလျောက် Otp Screen သို့ ပို့ပေးခြင်း
      if (errorData && errorData.isVerified === false) {
        Alert.alert('Verification Required 🔒', 'Your account needs OTP activation.', [
          { 
            text: 'Verify Now', 
            onPress: () => navigation.navigate('Otp', { email: accountInput.trim().toLowerCase() }) 
          }
        ]);
      } else {
        Alert.alert('Sign In Failed ❌', errorData?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 🏢 App Icon & Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadge}>
            {/* 💡 သင့်ရဲ့ assets/ ထဲမှာ icon.png ရှိပါက ၎င်းပုံကို ပြသပါမည်။ မရှိသေးပါက Emoji ဖြင့် ယာယီအစားထိုးပါသည် */}
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logoImage} 
              defaultSource={require('../../assets/icon.png')} // iOS Loading image placeholder
            />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to stay connected with your world and friends</Text>
        </View>

        {/* 📝 Input Fields Section */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Username or Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="e.g., john_doe or john@example.com" 
              placeholderTextColor="#94a3b8"
              value={accountInput} 
              onChangeText={setAccountInput} 
              autoCapitalize="none" 
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Enter your password" 
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword} 
              value={password} 
              onChangeText={setPassword} 
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.6}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* 🚀 Action Buttons Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.6}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 28, 
    justifyContent: 'center', 
    paddingVertical: 40 
  },
  
  // Header Styles
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 35 
  },
  logoBadge: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    backgroundColor: '#f0f7ff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  title: { 
    fontFamily: fonts.bold.fontFamily, 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 8, 
    letterSpacing: -0.5 
  },
  subtitle: { 
    fontFamily: fonts.regular.fontFamily, 
    fontSize: 14, 
    color: '#64748b', 
    textAlign: 'center', 
    paddingHorizontal: 15, 
    lineHeight: 22 
  },
  
  // Form Input Styles
  formSection: { 
    marginBottom: 20 
  },
  inputLabel: { 
    fontFamily: fonts.semiBold.fontFamily, 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#334155', 
    marginBottom: 8, 
    marginLeft: 4 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 54,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    paddingHorizontal: 16,
    position: 'relative'
  },
  inputIcon: {
    marginRight: 12
  },
  input: { 
    flex: 1,
    height: '100%',
    fontSize: 15, 
    color: '#0f172a', 
    fontFamily: fonts.regular.fontFamily 
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4
  },
  forgotBtn: { 
    alignSelf: 'flex-end', 
    marginTop: -8, 
    marginRight: 4 
  },
  forgotText: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#007AFF', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  
  // Actions Buttons Styles
  actionSection: { 
    marginTop: 15, 
    alignItems: 'center' 
  },
  loginButton: { 
    width: '100%', 
    height: 54, 
    backgroundColor: '#007AFF', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2, 
    shadowColor: '#007AFF', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8 
  },
  loginButtonText: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600', 
    letterSpacing: 0.2 
  },
  footerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 25 
  },
  footerText: { 
    fontFamily: fonts.regular.fontFamily, 
    color: '#64748b', 
    fontSize: 14 
  },
  registerLink: { 
    fontFamily: fonts.bold.fontFamily, 
    color: '#007AFF', 
    fontSize: 14, 
    fontWeight: '700' 
  }
});