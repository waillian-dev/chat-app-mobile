// src/screens/UserProfileScreen.tsx
import React, { useState, useEffect } from 'react'; 
import {    
  StyleSheet,    
  Text,    
  View,    
  Image,    
  TouchableOpacity,    
  ActivityIndicator,    
  Platform,   
  Alert,
  Dimensions
} from 'react-native'; 
import { RouteProp } from '@react-navigation/native'; 
import { StackNavigationProp } from '@react-navigation/stack'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import axios from 'axios';  

// ✨ Premium Lucide Icons
import { ArrowLeft, MessageSquare, ShieldCheck, UserPlus, Phone, Mail, Info } from 'lucide-react-native'; 

import { API_URL } from '../config'; 
import { socketService } from '../config/socket'; 
import { fonts } from '../theme/fonts'; 
import { RootStackParamList } from '../types'; 

const { width, height } = Dimensions.get('window');
const COVER_HEIGHT = height * 0.40; // ပုံကို မျက်နှာပြင်၏ ၄၀% သတ်မှတ်

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>; 
type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>; 

interface Props {   
  route: UserProfileScreenRouteProp;   
  navigation: UserProfileScreenNavigationProp; 
}

export default function UserProfileScreen({ route, navigation }: Props) {   
  const { targetUserId, currentUserId } = route.params;   
  const [loading, setLoading] = useState<boolean>(true);   
  const [targetUser, setTargetUser] = useState<any>(null);   
  const [isMyFriend, setIsMyFriend] = useState<boolean>(false); 
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);   

  const fetchProfileAndFriendship = async () => {     
    try {       
      const token = await AsyncStorage.getItem('token');       
      const config = { headers: { Authorization: `Bearer ${token}` } };       
      
      const response = await axios.get(`${API_URL}/auth/users`, config);       
      const foundUser = response.data.find((u: any) => (u.id || u._id)?.toString() === targetUserId?.toString());              
      
      if (foundUser) {         
        setTargetUser(foundUser);       
      } else {         
        Alert.alert('Error', 'User not found.');         
        navigation.goBack();         
        return;       
      }       

      const friendRes = await axios.get(`${API_URL}/friend/list/${currentUserId}`, config);       
      const friends = friendRes.data.friends || [];       
      const checkFriendship = friends.some((f: any) => (f.id || f._id)?.toString() === targetUserId?.toString());       
      setIsMyFriend(checkFriendship);     
    } catch (err) {       
      console.error('Failed to load profile flow:', err);     
    } finally {       
      setLoading(false);     
    }   
  };   

  useEffect(() => {     
    fetchProfileAndFriendship();   
  }, [targetUserId]);   

  const handleAddFriendDirect = async () => {     
    setIsActionLoading(true);     
    try {       
      const token = await AsyncStorage.getItem('token');       
      await axios.post(`${API_URL}/friend/add`, { currentUserId, targetUserId }, {         
        headers: { Authorization: `Bearer ${token}` }       
      });              

      const activeSocket = socketService.getSocket();       
      if (activeSocket) {         
        activeSocket.emit('send_friend_request', { senderId: currentUserId, receiverId: targetUserId });       
      }       
      Alert.alert('Success', 'Friend request sent successfully!');       
      fetchProfileAndFriendship(); 
    } catch (err: any) {       
      Alert.alert('Notice', err.response?.data?.error || 'Failed to send request.');     
    } finally {       
      setIsActionLoading(false);     
    }   
  };   

  if (loading) {     
    return <View style={styles.center}><ActivityIndicator size="large" color="#0066FF" /></View>;   
  }

  const displayName = targetUser?.fullname || targetUser?.username;   
  const displayPhone = targetUser?.phoneNumber || 'N/A';
  const displayEmail = targetUser?.email || 'N/A';
  
  return (     
    <View style={styles.container}>              
      
      {/* 📷 1. FIXED TOP COVER IMAGE */}
      <View style={styles.coverContainer}>
        {targetUser?.profileImage ? (
          <Image source={{ uri: targetUser.profileImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderText}>
              {targetUser?.username ? targetUser.username.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.imageOverlayGradient} />
      </View>

      {/* 🎛️ FLOATING BACK BUTTON */}
      <TouchableOpacity 
        style={styles.floatingBackBtn} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <ArrowLeft color="#0f172a" size={20} />
      </TouchableOpacity>

      {/* 📜 2. PROFILE DETAILS CARD (NO SCROLL - FIXED POSITION) */}
      <View style={styles.profileMainCard}>
        
        <View style={styles.indicatorBar} />

        {/* User Headers */}
        <Text style={styles.fullnameText}>{displayName}</Text>           
        <Text style={styles.usernameText}>@{targetUser?.username}</Text>                      
        
        <View style={styles.badgeRow}>             
          <ShieldCheck color="#137333" size={13} style={{ marginRight: 4 }} />             
          <Text style={styles.badgeText}>Verified Convo User</Text>           
        </View>

        {/* Info Rows Container */}
        <View style={styles.infoFieldsWrapper}>
          <Text style={styles.infoCardTitle}>Information</Text>                      
          
          <View style={styles.infoItemCard}>
            <Phone color="#94a3b8" size={18} style={styles.itemIcon} />
            <View style={styles.infoTextColumn}>               
              <Text style={styles.infoLabelText}>Phone Number</Text>               
              <Text style={styles.infoValueText}>{displayPhone}</Text>             
            </View>           
          </View>           
          
          <View style={styles.infoItemCard}>
            <Mail color="#94a3b8" size={18} style={styles.itemIcon} />
            <View style={styles.infoTextColumn}>               
              <Text style={styles.infoLabelText}>Email Address</Text>               
              <Text style={styles.infoValueText}>{displayEmail}</Text>             
            </View>           
          </View>           
          
          <View style={styles.infoItemCard}>
            <Info color="#94a3b8" size={18} style={styles.itemIcon} />
            <View style={styles.infoTextColumn}>               
              <Text style={styles.infoLabelText}>Bio Status</Text>               
              <Text style={[styles.infoValueText, styles.bioText]}>                 
                "Hey there! I am using Convo Chat App."               
              </Text>             
            </View>           
          </View>         
        </View>

        {/* 🚀 3. ACTION BUTTON AT THE BOTTOM */}
        <View style={styles.buttonWrapper}>
          {isActionLoading ? (           
            <ActivityIndicator size="small" color="#0066FF" />         
          ) : isMyFriend ? (           
            <TouchableOpacity              
              style={[styles.actionBtnBase, styles.quickChatBtn]}             
              onPress={() => {               
                const activeSocket = socketService.getSocket();               
                if (!activeSocket) return Alert.alert("Error", "Lost connection to chat server.");               
                navigation.navigate('Chat', {                  
                  senderId: currentUserId,                  
                  receiverId: targetUserId,                  
                  receiverName: targetUser?.username,                  
                  socket: activeSocket                
                });             
              }}             
              activeOpacity={0.8}           
            >             
              <MessageSquare color="#ffffff" size={16} style={{ marginRight: 8 }} />             
              <Text style={styles.actionBtnText}>Chat with Friend</Text>           
            </TouchableOpacity>         
          ) : (           
            <TouchableOpacity              
              style={[styles.actionBtnBase, styles.quickAddBtn]}             
              onPress={handleAddFriendDirect}             
              activeOpacity={0.8}           
            >             
              <UserPlus color="#ffffff" size={16} style={{ marginRight: 8 }} />             
              <Text style={styles.actionBtnText}>Add Friend</Text>           
            </TouchableOpacity>         
          )}
        </View>

      </View>
    </View>   
  ); 
}

const styles = StyleSheet.create({   
  container: { flex: 1, backgroundColor: '#ffffff' },   
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },   
  
  // Top Cover Image
  coverContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: COVER_HEIGHT, width: width },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  coverPlaceholderText: { color: '#0066FF', fontSize: 72, fontFamily: fonts.bold.fontFamily, fontWeight: '700' },
  imageOverlayGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  
  // Back Button
  floatingBackBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 36, left: 20, width: 40, height: 40, borderRadius: 14, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  
  // Main Fixed Card Panel
  profileMainCard: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height - COVER_HEIGHT + 32, // Cover ရဲ့အောက်ခြေကနေ အောက်ဆုံးထိ ကွက်တိနေရာယူမည်
    backgroundColor: '#ffffff', 
    // borderTopLeftRadius: 32, 
    // borderTopRightRadius: 32, 
    paddingHorizontal: 24, 
    alignItems: 'center',
    shadowColor: '#0f172a', 
    shadowOffset: { width: 0, height: -10 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 16, 
    elevation: 8,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24 // ဖုန်းအောက်ခြေ Area အတွက် Space ချန်ခြင်း
  },
  indicatorBar: { width: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 12 },
  
  fullnameText: { fontSize: 24, color: '#0f172a', fontFamily: fonts.bold.fontFamily, fontWeight: '700', textAlign: 'center', letterSpacing: -0.6, marginTop: 8 },   
  usernameText: { fontSize: 14, color: '#0066FF', fontFamily: fonts.semiBold.fontFamily, marginTop: 2, fontWeight: '600' },   
  badgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f4ea', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 10 },   
  badgeText: { fontSize: 11, color: '#137333', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  
  // Info Fields Area
  infoFieldsWrapper: { width: '100%', marginTop: 10 },
  infoCardTitle: { fontFamily: fonts.bold.fontFamily, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 2 },   
  infoItemCard: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#f8fafc', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 10 },   
  itemIcon: { marginRight: 14 },
  infoTextColumn: { flex: 1 },   
  infoLabelText: { fontSize: 12, color: '#94a3b8', fontFamily: fonts.regular.fontFamily, marginBottom: 1 },   
  infoValueText: { fontSize: 15, color: '#334155', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  bioText: { fontStyle: 'italic', color: '#64748b', fontWeight: '400' },
  
  // Button Setup
  buttonWrapper: { width: '100%', marginTop: 10 },
  actionBtnBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 52, borderRadius: 16, ...Platform.select({ ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10 }, android: { elevation: 3 } }) },   
  quickChatBtn: { backgroundColor: '#4CD964', shadowColor: '#4CD964' }, 
  quickAddBtn: { backgroundColor: '#0066FF', shadowColor: '#0066FF' },   
  actionBtnText: { color: '#ffffff', fontSize: 16, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' } 
});