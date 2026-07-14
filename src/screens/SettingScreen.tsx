// src/screens/SettingScreen.tsx
import React, { useState, useEffect } from 'react'; 
import {    
  StyleSheet,    
  Text,    
  View,    
  TouchableOpacity,    
  ScrollView,    
  Switch,    
  Alert,    
  ActivityIndicator,   
  Platform,   
  Modal 
} from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { StackNavigationProp } from '@react-navigation/stack'; 

// ✨ Premium Lucide Icons (ရှင်းလင်းသော အချိုးအစားအတွက်သာ သုံးမည်)
import { ChevronRight, X } from 'lucide-react-native'; 

import { API_URL } from '../config'; 
import { fonts } from '../theme/fonts'; 
import { RootStackParamList, User } from '../types'; 
import { socketService } from '../config/socket'; 
import axios from 'axios';

type SettingScreenNavigationProp = StackNavigationProp<RootStackParamList>; 

interface Props {   
  navigation: SettingScreenNavigationProp; 
}

export default function SettingScreen({ navigation }: Props) {   
  const [user, setUser] = useState<User | null>(null);   
  const [loading, setLoading] = useState<boolean>(true);   
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState<boolean>(false);   
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);   
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);   
  
  // App Preferences States   
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);   
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(true);   

  useEffect(() => {     
    const loadUser = async () => {       
      try {         
        const storedUser = await AsyncStorage.getItem('user');         
        if (storedUser) {           
          setUser(JSON.parse(storedUser));         
        }       
      } catch (err) {         
        console.error('Failed to load user in settings:', err);       
      } finally {         
        setLoading(false);       
      }     
    };     
    loadUser();   
  }, []);   

  const handleConfirmLogout = async () => {     
    setIsLoggingOut(true);     
    try {       
      socketService.disconnect();              
      await AsyncStorage.multiRemove(['token', 'user']);              
      setIsLogoutModalVisible(false);       
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });     
    } catch (err) {       
      console.error('Logout error:', err);     
    } finally {       
      setIsLoggingOut(false);     
    }   
  };   

  const handleDeleteAccount = async () => {     
    if (!user) return;     
    Alert.alert(       
      'Account Deletion',        
      'This action is permanent. All your messages, cloud profile pictures, and friendships will be deleted forever. Do you wish to proceed?',        
      [         
        { text: 'Cancel', style: 'cancel' },         
        {            
          text: 'Delete Permanently',            
          style: 'destructive',           
          onPress: async () => {             
            setDeleteLoading(true);             
            try {               
               const token = await AsyncStorage.getItem('token');                              
               await axios.delete(`${API_URL}/auth/delete-account/${user.id}`, {                 
                 headers: { Authorization: `Bearer ${token}` }               
               });               
               Alert.alert('Account Deleted', 'Your account has been wiped out successfully.', [                 
                 {                   
                   text: 'OK',                   
                   onPress: async () => {                     
                     await AsyncStorage.clear();                     
                     navigation.replace('Register');                   
                   }                 
                 }               
               ]);             
            } catch (error: any) {               
               Alert.alert('Error', error.response?.data?.error || 'Failed to delete your account.');             
            } finally {               
               setDeleteLoading(false);             
            }           
          }         
        }       
      ]     
    );   
  };   

  if (loading) {     
    return <View style={styles.center}><ActivityIndicator size="large" color="#0066FF" /></View>;   
  }

  return (     
    <View style={styles.container}>       
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>                  
        
        <Text style={styles.headerTitle}>Settings</Text>         

        {/* 🔒 CATEGORY 1: SECURITY & ACCOUNT */}         
        <Text style={styles.sectionHeader}>Security & Account</Text>         
        <View style={styles.cardGroup}>                      
          <TouchableOpacity              
            style={styles.settingRow}              
            onPress={() => navigation.navigate('ChangePassword' as any)}              
            activeOpacity={0.6}             
          >             
            <Text style={styles.rowText}>Change Password</Text>             
            <ChevronRight color="#cbd5e1" size={16} />           
          </TouchableOpacity>           
          
          <View style={styles.divider} />           
          
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.6}>             
            <Text style={styles.rowText}>Privacy & Features</Text>             
            <ChevronRight color="#cbd5e1" size={16} />           
          </TouchableOpacity>         
        </View>         

        {/* ⚙️ CATEGORY 2: APP PREFERENCES (CLEAN SWITCHES) */}         
        <Text style={styles.sectionHeader}>Preferences</Text>         
        <View style={styles.cardGroup}>                      
          <View style={styles.settingRowNonClickable}>             
            <Text style={styles.rowText}>Push Notifications</Text>             
            <Switch                
              value={isNotificationEnabled}                
              onValueChange={setIsNotificationEnabled}               
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}               
              thumbColor={isNotificationEnabled ? '#0066FF' : '#f4f4f5'}             
            />           
          </View>           
          
          <View style={styles.divider} />           
          
          <View style={styles.settingRowNonClickable}>             
            <Text style={styles.rowText}>Dark Mode</Text>             
            <Switch                
              value={isDarkMode}                
              onValueChange={setIsDarkMode}               
              trackColor={{ false: '#e2e8f0', true: '#e9d5ff' }}               
              thumbColor={isDarkMode ? '#a855f7' : '#f4f4f5'}             
            />           
          </View>         
        </View>         

        {/* ℹ️ CATEGORY 3: ABOUT APP */}         
        <Text style={styles.sectionHeader}>About</Text>         
        <View style={styles.cardGroup}>           
          <View style={styles.settingRowNonClickable}>             
            <Text style={styles.rowText}>Version</Text>             
            <Text style={styles.versionNumberText}>1.0.0.6 (26)</Text>           
          </View>         
        </View>         

        {/* 🚨 CATEGORY 4: DANGER ZONE */}         
        <Text style={[styles.sectionHeader, { color: '#ef4444' }]}>Danger Zone</Text>         
        <View style={[styles.cardGroup, { borderColor: '#fee2e2', borderWidth: 1 }]}>                      
          <TouchableOpacity style={styles.settingRow} onPress={() => setIsLogoutModalVisible(true)} activeOpacity={0.6}>             
            <Text style={[styles.rowText, { color: '#ef4444' }]}>Sign Out Session</Text>             
            <ChevronRight color="#fca5a5" size={16} />           
          </TouchableOpacity>           
          
          <View style={styles.divider} />           
          
          <TouchableOpacity              
            style={styles.settingRow}              
            onPress={handleDeleteAccount}              
            disabled={deleteLoading}             
            activeOpacity={0.6}           
          >             
            {deleteLoading ? (                 
              <ActivityIndicator color="#ef4444" size="small" style={{ marginLeft: 4 }} />               
            ) : (                 
              <Text style={[styles.rowText, { color: '#ef4444', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' }]}>                   
                Delete Account Permanently                 
              </Text>               
            )}             
            <ChevronRight color="#fca5a5" size={16} />           
          </TouchableOpacity>         
        </View>       
      </ScrollView>       

      {/* 👑 PREMIUM LOGOUT CONFIRM MODAL */}
      <Modal         
        animationType="fade"         
        transparent={true}             
        visible={isLogoutModalVisible}         
        onRequestClose={() => setIsLogoutModalVisible(false)}         
      >         
        <View style={styles.modalBlurOverlay}>                      
          <View style={styles.modalCardContainer}>                          
            <TouchableOpacity                
              style={styles.modalCloseCornerBtn}                
              onPress={() => setIsLogoutModalVisible(false)}             
            >               
              <X color="#94a3b8" size={16} />             
            </TouchableOpacity>             

            <Text style={styles.modalTitle}>Confirm Log Out?</Text>             
            <Text style={styles.modalDescription}>               
              Are you sure you want to log out from Convo? You will need to sign in again to receive new messages.             
            </Text>             

            <View style={styles.modalActionRow}>                              
              <TouchableOpacity                  
                style={[styles.modalBtn, styles.cancelBtn]}                  
                onPress={() => setIsLogoutModalVisible(false)}                 
                activeOpacity={0.6}               
              >                 
                <Text style={styles.cancelBtnText}>Cancel</Text>               
              </TouchableOpacity>               

              <TouchableOpacity                  
                style={[styles.modalBtn, styles.confirmBtn]}                  
                onPress={handleConfirmLogout}                 
                disabled={isLoggingOut}                 
                activeOpacity={0.7}               
              >                 
                {isLoggingOut ? (                   
                  <ActivityIndicator size="small" color="#ffffff" />                 
                ) : (                   
                  <Text style={styles.confirmBtnText}>Log Out</Text>                 
                )}               
              </TouchableOpacity>             
            </View>           
          </View>         
        </View>       
      </Modal>     
    </View>   
  ); 
}

const styles = StyleSheet.create({   
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20 },   
  scrollContainer: { flexGrow: 1, paddingVertical: 30, paddingBottom: 110 },   
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },   
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 20, marginTop: Platform.OS === 'ios' ? 16 : 32, fontFamily: fonts.bold.fontFamily, letterSpacing: -0.5 },   
  
  // Section Headings Setup
  sectionHeader: { fontFamily: fonts.bold.fontFamily, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 0.8, marginLeft: 2 },   
  
  // Premium Card Block Setup (🧼 Minimalist No Inner Icons)
  cardGroup: { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: '#f1f5f9', overflow: 'hidden', paddingHorizontal: 16, marginBottom: 12 },   
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },   
  settingRowNonClickable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },   
  rowText: { fontSize: 15, color: '#1e293b', fontFamily: fonts.regular.fontFamily },   
  divider: { height: 1, backgroundColor: '#f1f5f9', width: '100%' },   
  versionNumberText: { fontSize: 13, color: '#94a3b8', fontFamily: fonts.regular.fontFamily },   
  
  // Custom Modal Architecture
  modalBlurOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },   
  modalCardContainer: { 
    width: '100%', 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    position: 'relative',     
    ...Platform.select({       
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 16 },       
      android: { elevation: 6 }     
    })   
  },   
  modalCloseCornerBtn: { position: 'absolute', top: 16, right: 16, padding: 4, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },   
  modalTitle: { fontSize: 18, fontFamily: fonts.bold.fontFamily, fontWeight: '700', color: '#0f172a', marginBottom: 8, marginTop: 6 },   
  modalDescription: { fontSize: 14, fontFamily: fonts.regular.fontFamily, color: '#64748b', textAlign: 'center', lineHeight: 21, paddingHorizontal: 6, marginBottom: 20 },   
  
  // Action Buttons Group inside Modal
  modalActionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },   
  modalBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },   
  cancelBtn: { backgroundColor: '#f1f5f9', marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0' },   
  cancelBtnText: { color: '#475569', fontSize: 15, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  confirmBtn: { backgroundColor: '#FF3B30' },   
  confirmBtnText: { color: '#ffffff', fontSize: 15, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' } 
});