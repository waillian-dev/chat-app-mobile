// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {    
  StyleSheet,    
  Text,    
  TextInput,    
  TouchableOpacity,    
  View,    
  Alert,    
  ScrollView,    
  ActivityIndicator,    
  KeyboardAvoidingView,    
  Platform,
  Image
} from 'react-native'; 
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { StackNavigationProp } from '@react-navigation/stack'; 
import { Ionicons } from '@expo/vector-icons'; 
import axios from 'axios'; 
import { API_URL } from '../config'; 
import { RootStackParamList } from '../types'; 
import { fonts } from '../theme/fonts'; 

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>; 

interface Props {   
  navigation: RegisterScreenNavigationProp; 
}

export default function RegisterScreen({ navigation }: Props) {   
  const [fullname, setFullname] = useState<string>('');   
  const [username, setUsername] = useState<string>('');   
  const [email, setEmail] = useState<string>('');   
  const [phoneNumber, setPhoneNumber] = useState<string>('');   
  const [password, setPassword] = useState<string>('');   
  const [loading, setLoading] = useState<boolean>(false);   
  const [showPassword, setShowPassword] = useState<boolean>(false);   
  
  // Date Picker States   
  const [birthdate, setBirthdate] = useState<Date>(new Date());   
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);   
  const [isDateSelected, setIsDateSelected] = useState<boolean>(false);   

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {     
    const currentDate = selectedDate || birthdate;     
    setShowDatePicker(Platform.OS === 'ios');      
    setBirthdate(currentDate);     
    setIsDateSelected(true);   
  };   

  const formatDateString = (date: Date): string => {     
    const year = date.getFullYear();     
    const month = (date.getMonth() + 1).toString().padStart(2, '0');     
    const day = date.getDate().toString().padStart(2, '0');     
    return `${year}-${month}-${day}`;   
  };   

  const handleRegister = async () => {     
    if (!fullname.trim() || !username.trim() || !email.trim() || !phoneNumber.trim() || !password || !isDateSelected) {       
      return Alert.alert('Missing Info', 'Please fill in all fields including your birthdate.');     
    }     
    setLoading(true);     
    try {       
      await axios.post(`${API_URL}/auth/send-otp`, {         
        email: email.trim().toLowerCase()       
      });       
      Alert.alert('OTP Dispatched', `We have successfully sent a 6-digit verification code to your Gmail Inbox!`, [         
        {            
          text: 'Proceed to Verify',            
          onPress: () => {              
            navigation.navigate('Otp', {                
              email: email.trim().toLowerCase(),               
              username: username.trim(),               
              fullname: fullname.trim(),               
              password: password,               
              phoneNumber: phoneNumber.trim(),                
              birthdate: formatDateString(birthdate)               
            } as any);           
          }         
        }       
      ]);     
    } catch (error: any) {       
      Alert.alert('Sign Up Failed', error.response?.data?.error || 'Unable to register or dispatch OTP. Please try again.');     
    } finally {       
      setLoading(false);     
    }   
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
        keyboardShouldPersistTaps="handled" // စာရိုက်နေရင်း အပြင်ကိုနှိပ်ရင် Keyboard ပြန်ဆင်းသွားစေရန်
      >                  
        
        {/* 🏷️ BRAND HEADER SECTION (App Icon + Name ဘေးချင်းယှဉ်လျက်) */}         
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
          <Text style={styles.title}>Create Account</Text>           
          <Text style={styles.subtitle}>Join us today and get connected with your world</Text>         
        </View>         

        {/* 📝 FORM FIELDS SECTION */}         
        <View style={styles.formSection}>                      
          <Text style={styles.inputLabel}>Full Name</Text>           
          <View style={styles.inputWrapper}>             
            <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />             
            <TextInput                
              style={styles.input}                
              placeholder="John Doe"                
              placeholderTextColor="#94a3b8"                
              value={fullname}                
              onChangeText={setFullname}              
            />           
          </View>           

          <Text style={styles.inputLabel}>Username</Text>           
          <View style={styles.inputWrapper}>             
            <Ionicons name="at-outline" size={20} color="#94a3b8" style={styles.inputIcon} />             
            <TextInput                
              style={styles.input}                
              placeholder="john_doe123"                
              placeholderTextColor="#94a3b8"                
              value={username}                
              onChangeText={setUsername}                
              autoCapitalize="none"              
            />           
          </View>           

          <Text style={styles.inputLabel}>Email Address</Text>           
          <View style={styles.inputWrapper}>             
            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />             
            <TextInput                
              style={styles.input}                
              placeholder="john@example.com"                
              placeholderTextColor="#94a3b8"                
              value={email}                
              onChangeText={setEmail}                
              keyboardType="email-address"                
              autoCapitalize="none"              
            />           
          </View>           

          <Text style={styles.inputLabel}>Phone Number</Text>           
          <View style={styles.inputWrapper}>             
            <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />             
            <TextInput                
              style={styles.input}                
              placeholder="+959..."                
              placeholderTextColor="#94a3b8"                
              value={phoneNumber}                
              onChangeText={setPhoneNumber}                
              keyboardType="phone-pad"              
            />           
          </View>           

          {/* 📅 BIRTHDATE PICKER */}           
          <Text style={styles.inputLabel}>Birthdate</Text>           
          <TouchableOpacity              
            style={styles.dateInputClickable}              
            onPress={() => setShowDatePicker(true)}             
            activeOpacity={0.7}           
          >             
            <Ionicons name="calendar-outline" size={20} color="#94a3b8" style={styles.inputIcon} />             
            <Text style={[styles.dateInputText, isDateSelected ? { color: '#0f172a' } : { color: '#94a3b8' }]}>               
              {isDateSelected ? formatDateString(birthdate) : 'Select your birthdate'}              
            </Text>           
          </TouchableOpacity>           

          {showDatePicker && (             
            <DateTimePicker               
              value={birthdate}               
              mode="date"               
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}               
              onChange={onDateChange}               
              maximumDate={new Date()}              
            />           
          )}           

          <Text style={styles.inputLabel}>Password</Text>           
          <View style={styles.inputWrapper}>             
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />             
            <TextInput                
              style={styles.input}                
              placeholder="Create a strong password"                
              placeholderTextColor="#94a3b8"                
              secureTextEntry={!showPassword}                
              value={password}                
              onChangeText={setPassword}                
              autoCapitalize="none"              
            />             
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>               
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />             
            </TouchableOpacity>           
          </View>         
        </View>         

        {/* 🚀 ACTION BUTTONS SECTION */}         
        <View style={styles.actionSection}>           
          <TouchableOpacity              
            style={styles.registerButton}              
            onPress={handleRegister}              
            disabled={loading}             
            activeOpacity={0.8}           
          >             
            {loading ? (               
              <ActivityIndicator color="#ffffff" />             
            ) : (               
              <Text style={styles.registerButtonText}>Sign Up</Text>             
            )}           
          </TouchableOpacity>                      
          
          <View style={styles.footerRow}>             
            <Text style={styles.footerText}>Already have an account? </Text>             
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.6}>               
              <Text style={styles.loginLink}>Sign In</Text>             
            </TouchableOpacity>           
          </View>         
        </View>       
      </ScrollView>     
    </KeyboardAvoidingView>   
  ); 
}

const styles = StyleSheet.create({   
  container: { flex: 1, backgroundColor: '#ffffff' },   
  scrollContainer: { 
    flexGrow: 1,
    paddingHorizontal: 24, 
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 40 
  },  
  // Brand Header Setup
  brandHeaderContainer: { alignItems: 'center', marginBottom: 28, marginTop: Platform.OS === 'ios' ? 10 : 20 },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
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
  title: { fontFamily: fonts.bold.fontFamily, fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 },   
  subtitle: { fontFamily: fonts.regular.fontFamily, fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 15, lineHeight: 22 },   
  
  // Form Fields Structure
  formSection: { marginBottom: 10 },   
  inputLabel: { fontFamily: fonts.semiBold.fontFamily, fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 4 },   
  inputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 16, paddingHorizontal: 16, position: 'relative' },   
  inputIcon: { marginRight: 12 },   
  input: { flex: 1, height: '100%', fontSize: 15, color: '#0f172a', fontFamily: fonts.regular.fontFamily },   
  eyeIcon: { position: 'absolute', right: 16, padding: 4 },   
  dateInputClickable: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 16 },   
  dateInputText: { fontSize: 15, fontFamily: fonts.regular.fontFamily },   
  
  // Action Buttons Layer
  actionSection: { marginTop: 10, alignItems: 'center' },   
  registerButton: { 
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
  registerButtonText: { fontFamily: fonts.semiBold.fontFamily, color: '#ffffff', fontSize: 16, fontWeight: '600' },   
  footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },   
  footerText: { fontFamily: fonts.regular.fontFamily, color: '#64748b', fontSize: 14 },   
  loginLink: { fontFamily: fonts.bold.fontFamily, color: '#007AFF', fontSize: 14, fontWeight: '700' } 
});