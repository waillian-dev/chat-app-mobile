// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
// ✨ Premium Lucide Icons
import { Camera, Save, LogOut } from 'lucide-react-native';

import { API_URL } from '../config';
import { fonts } from '../theme/fonts';
import { User as UserType } from '../types';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<UserType | null>(null);
  const [fullname, setFullname] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const { showToast } = useToast(); 
  // 🔄 Load User Profile from local storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser: UserType = JSON.parse(storedUser);
          setUser(parsedUser);
          setFullname(parsedUser.fullname);
          setPhoneNumber(parsedUser.phoneNumber);
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // 📷 1. Pick Image & Upload Directly to Cloudflare R2
  const handlePickAndUploadImage = async () => {
    if (!user) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return showToast('We need camera roll permissions to upload your profile picture.','error');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const selectedImageUri = result.assets[0].uri;
    const fileExtension = selectedImageUri.split('.').pop() || 'jpg';
    
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('image', {
      uri: selectedImageUri,
      name: `profile-${user.id}.${fileExtension}`,
      type: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`
    } as any);

    setUploadLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/auth/upload-profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const updatedImageUrl = response.data.profileImage;
      
      const updatedUserObj = { ...user, profileImage: updatedImageUrl };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserObj));
      setUser(updatedUserObj);

      showToast('Your cloud profile picture has been updated successfully!', 'success');
    } catch (error: any) {
      console.error('R2 upload error:', error);
      showToast('Upload Failed ❌', error.response?.data?.error || 'Something went wrong while uploading.');
    } finally {
      setUploadLoading(false);
    }
  };

  // 📝 2. Update Profile Text Information (Name, Phone)
  const handleUpdateProfileInfo = async () => {
    if (!user) return;
    if (!fullname.trim() || !phoneNumber.trim()) {
      return showToast( 'Name and Phone number fields cannot be empty.');
    }

    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.put(`${API_URL}/auth/update-profile`, {
        userId: user.id,
        fullname: fullname.trim(),
        phoneNumber: phoneNumber.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const serverUser = response.data.user;
      const updatedUserObj = {
        ...user,
        fullname: serverUser.fullname,
        phoneNumber: serverUser.phoneNumber
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUserObj));
      setUser(updatedUserObj);

      showToast('Profile information updated successfully!','success');
    } catch (error: any) {
      showToast('Update Failed ❌', error.response?.data?.error || 'Failed to update information.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // 🚪 3. Logout Account Function
  const handleLogout = async () => {
    Alert.alert('Logout 🚪', 'Are you sure you want to sign out of Convo Chat?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear(); 
          navigation.replace('Login');
        }
      }
    ]);
  };

  if (loading || !user) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0066FF" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        <Text style={styles.headerTitle}>My Profile</Text>

        {/* 📷 SECTION 1: PROFILE IMAGE UPLOAD (ROUNDED SQUARE TYPE) */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.username[0]?.toUpperCase()}</Text>
              </View>
            )}

            {uploadLoading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}

            <TouchableOpacity 
              style={styles.cameraBadge} 
              onPress={handlePickAndUploadImage}
              disabled={uploadLoading}
              activeOpacity={0.8}
            >
              <Camera color="#fff" size={15} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userTagText}>{user.fullname || user.username}</Text>
          <Text style={styles.emailSubText}>@{user.username}</Text>
        </View>

        {/* 📥 SECTION 2: EDITABLE DATA INPUT FIELDS (🧼 CLEAN TYPE) */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.input} value={fullname} onChangeText={setFullname} placeholder="Your Full Name" placeholderTextColor="#94a3b8" />
          </View>

          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone Number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />
          </View>

          <Text style={styles.inputLabel}>Email Address (Read-Only)</Text>
          <View style={[styles.inputWrapper, styles.disabledInput]}>
            <TextInput style={[styles.input, { color: '#94a3b8' }]} value={user.email} editable={false} />
          </View>
        </View>

        {/* 🚀 SECTION 3: ACTION BUTTONS AREA */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdateProfileInfo}
            disabled={updateLoading}
            activeOpacity={0.8}
          >
            {updateLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Save color="#fff" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.6}>
            <LogOut color="#ef4444" size={16} style={{ marginRight: 6 }} />
            <Text style={styles.logoutButtonText}>Sign Out Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 30, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 25, marginTop: Platform.OS === 'ios' ? 16 : 32, fontFamily: fonts.bold.fontFamily, letterSpacing: -0.5 },
  
  // Avatar UI Styles (Rounded Square Premium Layout)
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative', width: 96, height: 96, borderRadius: 28, marginBottom: 16 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 28, borderWidth: 1.5, borderColor: '#e2e8f0' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 28, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  avatarText: { color: '#0066FF', fontSize: 32, fontFamily: fonts.bold.fontFamily, fontWeight: '700' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0066FF', width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 4 }, android: { elevation: 3 } }) },
  userTagText: { fontFamily: fonts.bold.fontFamily, fontSize: 18, color: '#0f172a', marginBottom: 4, letterSpacing: -0.3 },
  emailSubText: { fontFamily: fonts.regular.fontFamily, fontSize: 13, color: '#64748b' },
  
  // Input UI Styles
  formSection: { marginBottom: 20 },
  inputLabel: { fontFamily: fonts.semiBold.fontFamily, fontSize: 13, color: '#475569', fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 16, marginBottom: 16 },
  disabledInput: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  input: { flex: 1, height: '100%', fontSize: 15, color: '#0f172a', fontFamily: fonts.regular.fontFamily },
  
  // Actions UI Buttons Styles
  actionSection: { marginTop: 12, alignItems: 'center' },
  saveButton: { flexDirection: 'row', width: '100%', height: 52, backgroundColor: '#0066FF', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 18, ...Platform.select({ ios: { shadowColor: '#0066FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 }, android: { elevation: 2 } }) },
  saveButtonText: { color: '#ffffff', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600', fontSize: 15 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  logoutButtonText: { color: '#ef4444', fontFamily: fonts.bold.fontFamily, fontWeight: '700', fontSize: 14 }
});