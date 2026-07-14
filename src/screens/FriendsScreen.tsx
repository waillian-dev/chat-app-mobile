// src/screens/FriendsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; 
import {    
  StyleSheet,    
  Text,    
  View,    
  TextInput,    
  FlatList,    
  TouchableOpacity,    
  Image,    
  ActivityIndicator,    
  Alert,    
  ScrollView,    
  Platform 
} from 'react-native'; 
import { useFocusEffect } from '@react-navigation/native'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { StackNavigationProp } from '@react-navigation/stack'; 
import axios from 'axios';  

// ✨ Premium Lucide Icons
import { Search, UserPlus, Check, MessageSquare, User, Clock } from 'lucide-react-native'; 

import { API_URL } from '../config'; 
import { socketService } from '../config/socket'; 
import { fonts } from '../theme/fonts'; 
import { RootStackParamList, User as UserType } from '../types'; 

type FriendsScreenNavigationProp = StackNavigationProp<RootStackParamList>; 

interface Props {   
  navigation: FriendsScreenNavigationProp; 
}

interface SearchResultData {   
  user: UserType & { _id: string };   
  friendshipStatus: 'none' | 'pending' | 'accepted';   
  isRequester: boolean; 
}

export default function FriendsScreen({ navigation }: Props) {   
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);   
  const [loading, setLoading] = useState<boolean>(true);   
  const [searchQuery, setSearchQuery] = useState<string>('');   
  const [searchLoading, setSearchLoading] = useState<boolean>(false);   
  
  const [friendsList, setFriendsList] = useState<any[]>([]);   
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);   
  const [searchResult, setSearchResult] = useState<SearchResultData | null>(null);   
  
  const socket = socketService.getSocket();   

  useEffect(() => {     
    if (!socket) return;     
    const handleFriendLiveRefresh = () => {       
      fetchFriendsData();      
    };     
    socket.on('friend_request_received', handleFriendLiveRefresh);     
    socket.on('friend_request_accepted', handleFriendLiveRefresh);     
    return () => {       
      socket.off('friend_request_received', handleFriendLiveRefresh);       
      socket.off('friend_request_accepted', handleFriendLiveRefresh);     
    };   
  }, [currentUserId, socket]);   

  useEffect(() => {     
    const getUserId = async () => {       
      const storedUser = await AsyncStorage.getItem('user');       
      if (storedUser) {         
        setCurrentUserId(JSON.parse(storedUser).id);       
      }     
    };     
    getUserId();   
  }, []);   

  const fetchFriendsData = async () => {     
    if (!currentUserId) return;     
    try {       
      const token = await AsyncStorage.getItem('token');       
      const config = { headers: { Authorization: `Bearer ${token}` } };       
      const res = await axios.get(`${API_URL}/friend/list/${currentUserId}`, config);       
      setFriendsList(res.data.friends);       
      setPendingRequests(res.data.pending);     
    } catch (err) {       
      console.error('Error fetching friends list:', err);     
    } finally {       
      setLoading(false);     
    }   
  };   

  useFocusEffect(     
    useCallback(() => {       
      if (currentUserId) fetchFriendsData();     
    }, [currentUserId])   
  );   

  const handleSearchUser = async () => {     
    if (searchQuery.trim() === '') return;     
    setSearchLoading(true);     
    setSearchResult(null);     
    try {       
      const token = await AsyncStorage.getItem('token');       
      const config = {          
        headers: { Authorization: `Bearer ${token}` },         
        params: { currentUserId, target: searchQuery.trim() }       
      };       
      const res = await axios.get(`${API_URL}/friend/search-to-add`, config);       
      setSearchResult(res.data);     
    } catch (err: any) {       
      Alert.alert('Not Found', err.response?.data?.error || 'User not found');     
    } finally {       
      setSearchLoading(false);     
    }   
  };   

  const handleAddFriend = async (targetUserId: string) => {     
    try {       
      const token = await AsyncStorage.getItem('token');       
      const config = { headers: { Authorization: `Bearer ${token}` } };       
      await axios.post(`${API_URL}/friend/add`, { currentUserId, targetUserId }, config);              
      if (socket) {         
        socket.emit('send_friend_request', { senderId: currentUserId, receiverId: targetUserId });       
      }       
      Alert.alert('Success', 'Friend request sent successfully!');       
      setSearchResult(prev => prev ? { ...prev, friendshipStatus: 'pending', isRequester: true } : null);       
      fetchFriendsData();     
    } catch (err: any) {       
      Alert.alert('Error', err.response?.data?.error || 'Failed to send request');     
    }   
  };   

  const handleAcceptFriend = async (targetUserId: string) => {     
    try {       
      const token = await AsyncStorage.getItem('token');       
      const config = { headers: { Authorization: `Bearer ${token}` } };       
      await axios.post(`${API_URL}/friend/accept`, { currentUserId, targetUserId }, config);              
      if (socket) {         
        socket.emit('accept_friend_request', { senderId: currentUserId, receiverId: targetUserId });       
      }       
      Alert.alert('Connected', 'You are now friends!');       
      if (searchResult && searchResult.user._id === targetUserId) {         
        setSearchResult(prev => prev ? { ...prev, friendshipStatus: 'accepted' } : null);       
      }       
      fetchFriendsData();     
    } catch (err) {       
      Alert.alert('Error', 'Failed to accept friend request');     
    }   
  };   

  if (loading) {     
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;   
  }

  return (     
    <View style={styles.container}>       
      <Text style={styles.headerTitle}>Contacts</Text>       
      
      {/* 🔍 SECTION 1: SEARCH BAR */}       
      <View style={styles.searchBoxContainer}>         
        <Search color="#94a3b8" size={18} style={{ marginRight: 10 }} />         
        <TextInput           
          style={styles.searchInput}           
          placeholder="Enter friend's phone number..."           
          placeholderTextColor="#94a3b8"           
          value={searchQuery}           
          onChangeText={setSearchQuery}           
          keyboardType="phone-pad"         
        />         
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearchUser} disabled={searchLoading}>           
          {searchLoading ? <ActivityIndicator color="#007AFF" size="small" /> : <Text style={styles.searchBtnText}>Search</Text>}         
        </TouchableOpacity>       
      </View>       

      {/* 🃏 SECTION 2: SEARCH RESULT DISPLAY CARD */}       
      {searchResult && (         
        <View style={styles.resultCard}>           
          <View style={styles.userRow}>                          
            <TouchableOpacity                
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}               
              onPress={() => navigation.navigate('UserProfile', {                  
                targetUserId: (searchResult.user.id || searchResult.user._id).toString(),                  
                currentUserId: currentUserId!                                                           
              })}               
              activeOpacity={0.6}             
            >               
              <View style={styles.avatarShape}>                 
                {searchResult.user.profileImage ? (                   
                  <Image source={{ uri: searchResult.user.profileImage }} style={styles.avatarImg} />                 
                ) : (                   
                  <Text style={styles.avatarText}>                     
                    {searchResult.user.username ? searchResult.user.username.charAt(0).toUpperCase() : 'U'}                   
                  </Text>                 
                )}               
              </View>               
              <View style={styles.info}>                 
                <Text style={styles.fullname}>{searchResult.user.fullname || searchResult.user.username}</Text>                 
                <Text style={styles.usernameText}>@{searchResult.user.username}</Text>               
              </View>             
            </TouchableOpacity>                          
            
            {searchResult.friendshipStatus === 'none' && (               
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddFriend(searchResult.user._id)}>                 
                <UserPlus color="#fff" size={14} style={{ marginRight: 4 }} />                 
                <Text style={styles.actionBtnText}>Add</Text>               
              </TouchableOpacity>             
            )}             
            {searchResult.friendshipStatus === 'pending' && searchResult.isRequester && (               
              <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}>                 
                <Clock color="#64748b" size={13} style={{ marginRight: 4 }} />                 
                <Text style={[styles.statusBadgeText, { color: '#64748b' }]}>Requested</Text>               
              </View>             
            )}             
            {searchResult.friendshipStatus === 'pending' && !searchResult.isRequester && (               
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e6f4ea' }]} onPress={() => handleAcceptFriend(searchResult.user._id)}>                 
                <Check color="#137333" size={14} style={{ marginRight: 4 }} />                 
                <Text style={[styles.actionBtnText, { color: '#137333' }]}>Accept</Text>               
              </TouchableOpacity>             
            )}             
            {searchResult.friendshipStatus === 'accepted' && (               
              <View style={[styles.statusBadge, { backgroundColor: '#e0f2fe' }]}>                 
                <User color="#007AFF" size={13} style={{ marginRight: 4 }} />                 
                <Text style={[styles.statusBadgeText, { color: '#007AFF' }]}>Friend</Text>               
              </View>             
            )}           
          </View>         
        </View>       
      )}       

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 4 }} contentContainerStyle={{ paddingBottom: 110 }}>                  
        
        {/* 📥 SECTION 3: PENDING REQUESTS */}         
        {pendingRequests.length > 0 && (           
          <View style={styles.sectionBlock}>             
            <Text style={styles.sectionTitle}>Friend Requests ({pendingRequests.length})</Text>             
            {pendingRequests.map((item) => (               
              <View key={item._id} style={styles.friendRow}>                 
                <View style={styles.avatarShapeSmall}>                   
                  {item.profileImage ? <Image source={{ uri: item.profileImage }} style={styles.avatarImg} /> : <Text style={styles.avatarTextSmall}>{item.username[0]?.toUpperCase()}</Text>}                 
                </View>                 
                <View style={styles.info}>                   
                  <Text style={styles.nameText}>{item.fullname}</Text>                   
                  <Text style={styles.userText}>@{item.username}</Text>                 
                </View>                 
                <TouchableOpacity style={styles.acceptMiniBtn} onPress={() => handleAcceptFriend(item._id)}>                   
                  <Text style={styles.acceptMiniBtnText}>Accept</Text>                 
                </TouchableOpacity>               
              </View>             
            ))}           
          </View>         
        )}         

        {/* 👥 SECTION 4: MY FRIENDS LIST */}         
        <View style={styles.sectionBlock}>           
          <Text style={styles.sectionTitle}>All Friends ({friendsList.length})</Text>           
          <FlatList             
            data={friendsList}             
            scrollEnabled={false}              
            keyExtractor={(item) => (item.id || item._id)?.toString()}             
            renderItem={({ item }) => {               
              const itemId = (item.id || item._id)?.toString();               
              return (                 
                <View style={styles.friendRow}>                   
                  <TouchableOpacity                      
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}                     
                    onPress={() => navigation.navigate('UserProfile', {                        
                      targetUserId: itemId,                        
                      currentUserId: currentUserId!                      
                    })}                     
                    activeOpacity={0.6}                   
                  >                     
                    <View style={styles.avatarShapeSmall}>                       
                      {item.profileImage ? (                         
                        <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />                       
                      ) : (                         
                        <Text style={styles.avatarShapeSmallText}>                           
                          {item.username ? item.username.charAt(0).toUpperCase() : 'U'}                         
                        </Text>                       
                      )}                     
                    </View>                     
                    <View style={styles.info}>                       
                      <Text style={styles.nameText}>{item.fullname || item.username}</Text>                       
                      <Text style={styles.userText}>@{item.username}</Text>                     
                    </View>                   
                  </TouchableOpacity>                                      
                  
                  <TouchableOpacity                      
                    style={styles.chatMiniBtn}                      
                    onPress={async () => {                       
                      const activeSocket = socketService.getSocket();                        
                      if (!activeSocket) {                         
                        return Alert.alert("Error", "Chat server connection lost. Please reload.");                       
                      }                       
                      navigation.navigate('Chat', {                          
                        senderId: currentUserId!,                          
                        receiverId: itemId,                          
                        receiverName: item.username,                          
                        socket: activeSocket                       
                      });                     
                    }}                   
                  >                     
                    <MessageSquare color="#007AFF" size={14} style={{ marginRight: 4 }} />                     
                    <Text style={styles.chatMiniBtnText}>Chat</Text>                   
                  </TouchableOpacity>                 
                </View>               
              );             
            }}             
            ListEmptyComponent={               
              <Text style={styles.emptyText}>No friends added yet. Try searching by phone number above!</Text>             
            }           
          />         
        </View>       
      </ScrollView>     
    </View>   
  ); 
}

const styles = StyleSheet.create({   
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 35 : 24 },   
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },   
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16, marginTop: Platform.OS === 'ios' ? 16 : 32, fontFamily: fonts.bold.fontFamily, letterSpacing: -0.5 },   
  
  // Search Bar Layout
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', height: 48, paddingLeft: 14, overflow: 'hidden', marginBottom: 18 },   
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a', fontFamily: fonts.regular.fontFamily, height: '100%' },   
  searchBtn: { height: '100%', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },   
  searchBtnText: { color: '#007AFF', fontSize: 15, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  
  // Result Card UI Setup
  resultCard: { backgroundColor: '#f0f7ff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 18 },   
  userRow: { flexDirection: 'row', alignItems: 'center' },   
  avatarShape: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },   
  avatarImg: { width: '100%', height: '100%' },   
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },   
  info: { flex: 1 },   
  fullname: { fontFamily: fonts.semiBold.fontFamily, fontSize: 15, color: '#0f172a' },   
  usernameText: { fontFamily: fonts.regular.fontFamily, fontSize: 13, color: '#007AFF', marginTop: 1 },   
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },   
  actionBtnText: { color: '#fff', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600', fontSize: 13 },   
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },   
  statusBadgeText: { fontSize: 12, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  
  // Contacts Streams Setup
  sectionBlock: { marginBottom: 20 },   
  sectionTitle: { fontFamily: fonts.bold.fontFamily, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.8, marginLeft: 2 },   
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },   
  avatarShapeSmall: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#64748b', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },   
  avatarShapeSmallText: { color: '#ffffff', fontSize: 16, fontFamily: fonts.bold.fontFamily },
  avatarTextSmall: { color: '#fff', fontSize: 15, fontWeight: 'bold' },   
  nameText: { fontFamily: fonts.semiBold.fontFamily, fontSize: 15, color: '#0f172a' },   
  userText: { fontFamily: fonts.regular.fontFamily, fontSize: 12, color: '#64748b', marginTop: 1 },   
  acceptMiniBtn: { backgroundColor: '#e6f4ea', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },   
  acceptMiniBtnText: { color: '#137333', fontSize: 13, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  chatMiniBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },   
  chatMiniBtnText: { color: '#007AFF', fontSize: 13, fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },   
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingHorizontal: 20, marginTop: 15, lineHeight: 22, fontFamily: fonts.regular.fontFamily } 
});