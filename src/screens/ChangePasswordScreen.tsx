// src/screens/ChangePasswordScreen.tsx
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
  ScrollView  
} from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { StackNavigationProp } from '@react-navigation/stack'; 
import { Ionicons } from '@expo/vector-icons'; // Smooth Eye Icons အတွက် သုံးပါမည်
import axios from 'axios'; 

import { API_URL } from '../config'; 
import { RootStackParamList } from '../types'; 
import { fonts } from '../theme/fonts'; 

type ChangePasswordNavigationProp = StackNavigationProp<RootStackParamList, any>; 

interface Props {   
  navigation: ChangePasswordNavigationProp; 
}

export default function ChangePasswordScreen({ navigation }: Props) {   
  const [oldPassword, setOldPassword] = useState<string>('');   
  const [newPassword, setNewPassword] = useState<string>('');   
  const [confirmPassword, setConfirmPassword] = useState<string>('');   
  const [loading, setLoading] = useState<boolean>(false);   
  
  // 👀 Show/Hide Password States   
  const [showOld, setShowOld] = useState<boolean>(false);   
  const [showNew, setShowNew] = useState<boolean>(false);   
  const [showConfirm, setShowConfirm] = useState<boolean>(false);   

  const handleChangePassword = async () => {     
    if (!oldPassword || !newPassword || !confirmPassword) {       
      return Alert.alert('Missing Info', 'Please fill in all fields.');     
    }     
    if (newPassword.length < 6) {       
      return Alert.alert('Weak Password', 'New password must be at least 6 characters long.');     
    }     
    if (newPassword !== confirmPassword) {       
      return Alert.alert('Mismatch', 'New password and confirm password do not match.');     
    }     

    setLoading(true);     
    try {       
      const storedUser = await AsyncStorage.getItem('user');       
      const token = await AsyncStorage.getItem('token');              
      
      if (!storedUser || !token) return;       
      const user = JSON.parse(storedUser);       

      await axios.put(`${API_URL}/auth/change-password`, {         
        userId: user.id,         
        oldPassword,         
        newPassword       
      }, {         
        headers: { Authorization: `Bearer ${token}` }       
      });       

      Alert.alert('Success ✨', 'Your password has been changed successfully!', [         
        { text: 'OK', onPress: () => navigation.goBack() }       
      ]);     
    } catch (error: any) {       
      Alert.alert('Failed ❌', error.response?.data?.error || 'Failed to change password. Please try again.');     
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
        keyboardShouldPersistTaps="handled"
      >                  
        
        {/* 📝 Header Text Section */}         
        <Text style={styles.title}>Update Password</Text>         
        <Text style={styles.subtitle}>Ensure your account stays secure by using a strong, unique password.</Text>         

        {/* 🧼 Minimalist Inputs Form Section */}         
        <View style={styles.formSection}>                      
          
          {/* Current Password Input */}           
          <Text style={styles.inputLabel}>Current Password</Text>           
          <View style={styles.inputWrapper}>             
            <TextInput                
              style={styles.input}               
              placeholder="Enter current password"               
              placeholderTextColor="#94a3b8"               
              secureTextEntry={!showOld}               
              value={oldPassword}               
              onChangeText={setOldPassword}               
              autoCapitalize="none"             
            />             
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowOld(!showOld)}>               
              <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />             
            </TouchableOpacity>           
          </View>           

          {/* New Password Input */}           
          <Text style={styles.inputLabel}>New Password</Text>           
          <View style={styles.inputWrapper}>             
            <TextInput                
              style={styles.input}               
              placeholder="Enter new password (min 6 chars)"               
              placeholderTextColor="#94a3b8"               
              secureTextEntry={!showNew}               
              value={newPassword}               
              onChangeText={setNewPassword}               
              autoCapitalize="none"             
            />             
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNew(!showNew)}>               
              <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />             
            </TouchableOpacity>           
          </View>           

          {/* Confirm New Password Input */}           
          <Text style={styles.inputLabel}>Confirm New Password</Text>           
          <View style={styles.inputWrapper}>             
            <TextInput                
              style={styles.input}               
              placeholder="Confirm new password"               
              placeholderTextColor="#94a3b8"               
              secureTextEntry={!showConfirm}               
              value={confirmPassword}               
              onChangeText={setConfirmPassword}               
              autoCapitalize="none"             
            />             
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>               
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />             
            </TouchableOpacity>           
          </View>         
        </View>         

        {/* 🚀 Submit Action Button */}         
        <TouchableOpacity            
          style={styles.submitButton}            
          onPress={handleChangePassword}           
          disabled={loading}           
          activeOpacity={0.8}         
        >           
          {loading ? (             
            <ActivityIndicator color="#ffffff" size="small" />           
          ) : (             
            <Text style={styles.submitButtonText}>Update Password</Text>           
          )}         
        </TouchableOpacity>       
      </ScrollView>     
    </KeyboardAvoidingView>   
  ); 
}

const styles = StyleSheet.create({   
  container: { flex: 1, backgroundColor: '#ffffff' },   
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 30, justifyContent: 'center' },   
  title: { fontFamily: fonts.bold.fontFamily, fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 },   
  subtitle: { fontFamily: fonts.regular.fontFamily, fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 32 },   
  
  // Minimalist Input Structures (Icon Clutter-Free)
  formSection: { marginBottom: 16 },   
  inputLabel: { fontFamily: fonts.semiBold.fontFamily, fontSize: 13, color: '#475569', fontWeight: '600', marginBottom: 6, marginLeft: 4 },   
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 16, marginBottom: 18, position: 'relative' },   
  input: { flex: 1, height: '100%', fontSize: 15, color: '#0f172a', fontFamily: fonts.regular.fontFamily },   
  eyeIcon: { position: 'absolute', right: 16, padding: 4 },   
  
  // Submit Action Button Setup
  submitButton: { 
    flexDirection: 'row', 
    width: '100%', 
    height: 52, 
    backgroundColor: '#0066FF', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#0066FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 2 }
    })
  },   
  submitButtonText: { color: '#ffffff', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600', fontSize: 15 } 
});