// src/screens/OtpScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import axios from 'axios';
import { API_URL } from '../config';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';

const { width } = Dimensions.get('window');

type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Otp'>;
type OtpScreenRouteProp = RouteProp<RootStackParamList, 'Otp'>;

interface Props {
  navigation: OtpScreenNavigationProp;
  route: OtpScreenRouteProp;
}

export default function OtpScreen({ route, navigation }: Props) {
  const { email, username, fullname, password, phoneNumber, birthdate } = route.params as any; 
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);

  // Hidden Hidden TextInput ကို လှမ်းထောက်ရန် Ref
  const hiddenInputRef = useRef<TextInput>(null);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // စာရိုက်တာ သို့မဟုတ် Paste လုပ်လိုက်တာကို ဖမ်းယူမည့် Function
  const handleTextChange = (text: string) => {
    // ကိန်းဂဏန်း သက်သက်သာ လက်ခံမည်
    const cleanedText = text.replace(/[^0-9]/g, '');
    setOtpCode(cleanedText);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      return Alert.alert('Invalid Code', 'Please enter a valid 6-digit OTP code.');
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email: email,
        username: username,
        fullname: fullname,
        password: password,
        phoneNumber: phoneNumber, 
        birthdate: birthdate,     
        otp: otpCode.trim()
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        Alert.alert('Activation Success ✨', 'Your account has been successfully verified! Welcome to Convo.', [
          { 
            text: "Let's Go 🚀", 
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home', params: { user: user } }], 
              });
            } 
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.error || 'The code you entered is incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email });
      Alert.alert('Code Resent', `A new verification code has been dispatched to your Gmail Inbox!`);
      setCountdown(60); 
      setOtpCode(''); 
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Unable to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ၆ ကွက် layout အတွက် Render ပြုလုပ်မည့် အပိုင်း
  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const digit = otpCode[i] || '';
      const isFocused = otpCode.length === i || (otpCode.length === 6 && i === 5);

      boxes.push(
        <View 
          key={i} 
          style={[
            styles.otpBox,
            digit !== '' && styles.otpBoxFilled,
            isFocused && styles.otpBoxFocused
          ]}
        >
          <Text style={styles.otpBoxText}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* 🏷️ BRAND HEADER SECTION */}
        <View style={styles.brandHeaderContainer}>
          <View style={styles.brandLogoRow}>
            <View style={styles.miniLogoBadge}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logoImage} 
                defaultSource={require('../../assets/icon.png')} 
              />
            </View>
            <Text style={styles.brandNameText}>Convo</Text>
          </View>
          
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            We have sent a 6-digit security code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        {/* 📥 6 INDIVIDUAL DIGIT BOXES (COPY-PASTE / KEYBOARD READY) */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Enter Security Code</Text>
          
          {/* အကွက် ၆ ကွက်အား Visual အနေဖြင့် ပြသပေးမည့် နေရာညှိချက် */}
          <TouchableOpacity 
            style={styles.otpBoxesContainer} 
            activeOpacity={1}
            onPress={() => hiddenInputRef.current?.focus()}
          >
            {renderOtpBoxes()}
          </TouchableOpacity>

          {/* 🛡️ မျက်စိဖြင့်မမြင်ရဘဲ ကီးဘုတ်နှင့် Paste လုပ်ငန်းစဉ်ကို ချိတ်ဆက်မည့် အဓိက Input ပါးပါးလေး */}
          <TextInput
            ref={hiddenInputRef}
            value={otpCode}
            onChangeText={handleTextChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            style={styles.hiddenTextInput}
            textContentType="oneTimeCode" // iOS Auto-fill OTP System Support
            autoComplete="sms-otp"        // Android Auto-fill Support
          />
        </View>

        {/* 🚀 ACTION AREA BUTTONS */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.verifyButton} 
            onPress={handleVerifyOtp} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Activate Account</Text>
            )}
          </TouchableOpacity>

          {/* 🔄 INTERACTIVE RESEND TIMER */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>Resend code in <Text style={styles.countdownText}>{countdown}s</Text></Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading} activeOpacity={0.6}>
                {resendLoading ? (
                  <ActivityIndicator color="#007AFF" size="small" />
                ) : (
                  <Text style={styles.resendLink}>Resend OTP Code 📩</Text>
                )}
              </TouchableOpacity>
            )}
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
    paddingHorizontal: 24, 
    justifyContent: 'center', 
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  
  // Brand Header Setup
  brandHeaderContainer: { alignItems: 'center', marginBottom: 35, marginTop: Platform.OS === 'ios' ? 10 : 20 },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  miniLogoBadge: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginRight: 10 
  },   
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },   
  brandNameText: { fontFamily: fonts.bold.fontFamily, fontSize: 24, fontWeight: '700', color: '#007AFF', letterSpacing: -0.6 },
  
  title: { 
    fontFamily: fonts.bold.fontFamily, 
    fontSize: 26, 
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
    lineHeight: 22 
  },
  emailHighlight: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#0f172a', 
    fontWeight: '600' 
  },
  
  // 📥 6 Individual OTP Boxes Styles
  formSection: { 
    marginBottom: 35, 
    alignItems: 'center',
    position: 'relative'
  },
  inputLabel: { 
    fontFamily: fonts.semiBold.fontFamily, 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: 18 
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4
  },
  otpBox: {
    width: (width - 48 - 40) / 6, // Screen size အလိုက် ညီညာစွာ အချိုးချပေးထားသည်
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  otpBoxFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#ffffff',
  },
  otpBoxFilled: {
    borderColor: '#4CD964',
    backgroundColor: '#f0fdf4'
  },
  otpBoxText: {
    fontSize: 20,
    fontFamily: fonts.bold.fontFamily,
    fontWeight: '700',
    color: '#0f172a'
  },
  hiddenTextInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0 // လုံးဝမမြင်ရအောင် ဖျောက်ထားပြီး Functional ပိုင်းအတွက် အလုပ်လုပ်သည်
  },
  
  // Action Buttons Layer
  actionSection: { 
    alignItems: 'center' 
  },
  verifyButton: { 
    width: '100%', 
    height: 52, 
    backgroundColor: '#007AFF', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...Platform.select({
      ios: { shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 2 }
    })
  },
  verifyButtonText: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600'
  },
  resendContainer: { 
    marginTop: 20, 
    height: 35, 
    justifyContent: 'center' 
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },
  timerText: { 
    fontFamily: fonts.regular.fontFamily, 
    color: '#64748b', 
    fontSize: 13 
  },
  countdownText: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#0f172a', 
    fontWeight: '700' 
  },
  resendLink: { 
    fontFamily: fonts.bold.fontFamily, 
    color: '#007AFF', 
    fontSize: 15, 
    fontWeight: '700' 
  }
});