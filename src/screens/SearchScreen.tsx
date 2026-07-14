// src/screens/SearchScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ✨ Premium Lucide Icons
import { ArrowLeft, Search, MessageSquare, UserPlus, MessageCircleX } from 'lucide-react-native';

import { API_URL } from '../config';
import { fonts } from '../theme/fonts';
import { RootStackParamList, User as UserType } from '../types';

type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'>;
type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;

interface Props {
  route: SearchScreenRouteProp;
  navigation: SearchScreenNavigationProp;
}

interface SearchMessageResult {
  messageId: string;
  text: string;
  createdAt: string;
  partner: {
    id: string;
    username: string;
    fullname: string;
  };
}

export default function SearchScreen({ route, navigation }: Props) {
  const { currentUserId, socket } = route.params as any;

  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [messages, setMessages] = useState<SearchMessageResult[]>([]);
  
  // 👥 မိမိ၏ သူငယ်ချင်းများစာရင်း ID List ကို သိမ်းဆည်းရန် State
  const [myFriendIds, setMyFriendIds] = useState<string[]>([]);

  // 🔄 စတင်ဖွင့်ချိန်တွင် မိမိ၏ လက်ရှိ Friend List ကို API မှ ကြိုတင်ဆွဲထားခြင်း
  const fetchMyFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/friend/list/${currentUserId}`, config);
      
      if (res.data && res.data.friends) {
        const ids = res.data.friends.map((f: any) => f._id.toString());
        setMyFriendIds(ids);
      }
    } catch (err) {
      console.error('Error loading friends list in search:', err);
    }
  };

  useEffect(() => {
    fetchMyFriends();
  }, [currentUserId]);

  // 🔍 Global Users & Messages Search
  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim() === '') {
      setUsers([]);
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/chat/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { currentUserId, query: text }
      });
      
      if (res.data.success) {
        setUsers(res.data.results.users || []);
        setMessages(res.data.results.messages || []);
      }
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ➕ Search Screen ထဲမှနေ၍ တိုက်ရိုက် Add Friend Request ပို့မည့် Function
  const handleAddFriendDirect = async (targetUserId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/friend/add`, { currentUserId, targetUserId }, config);
      
      if (socket) {
        socket.emit('send_friend_request', { senderId: currentUserId, receiverId: targetUserId });
      }

      Alert.alert('Sent ✨', 'Friend request sent successfully!');
      fetchMyFriends(); 
    } catch (err: any) {
      Alert.alert('Error ❌', err.response?.data?.error || 'Failed to send request');
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      
      {/* 👑 TOP PREMIUM SEARCH BAR NAVBAR */}
      <View style={styles.searchHeaderBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#0f172a" size={22} />
        </TouchableOpacity>
        
        <View style={styles.searchBoxWrapper}>
          <Search color="#94a3b8" size={18} style={styles.searchIcon} />
          <TextInput 
            style={styles.textInputBox}
            placeholder="Search users or messages..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearIconBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ⏳ LOADING SPINNER */}
      {loading && <ActivityIndicator size="small" color="#0066FF" style={{ marginTop: 20 }} />}

      {/* 📦 RESULTS STREAM */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 👤 SECTION A: USERS FOUND */}
        {users.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Users</Text>
            {users.map((item: any) => {
              const itemId = (item.id || item._id)?.toString() || '';
              const isFriend = myFriendIds.includes(itemId);

              return (
                <View key={itemId} style={styles.userCardRow}>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => navigation.navigate('UserProfile', { 
                      targetUserId: itemId, 
                      currentUserId: currentUserId 
                    })}
                    activeOpacity={0.6}
                  >
                    {/* Avatar Wrapper (Rounded Square Setup) */}
                    <View style={styles.avatarWrapper}>
                      {item.profileImage ? (
                        <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {item.username ? item.username.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Name and Username Info */}
                    <View style={styles.infoBlock}>
                      <Text style={styles.fullnameText}>{item.fullname || item.username}</Text>
                      <Text style={styles.usernameText}>@{item.username}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Dynamic Action Control Button */}
                  {isFriend ? (
                    <TouchableOpacity 
                      style={styles.chatActionBtnReal}
                      onPress={() => navigation.navigate('Chat', { senderId: currentUserId, receiverId: itemId, receiverName: item.username, socket })}
                      activeOpacity={0.7}
                    >
                      <MessageSquare color="#ffffff" size={13} style={{ marginRight: 4 }} />
                      <Text style={styles.chatBtnText}>Chat</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addFriendActionBox}
                      onPress={() => handleAddFriendDirect(itemId)}
                      activeOpacity={0.7}
                    >
                      <UserPlus color="#ffffff" size={13} style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}

                </View>
              );
            })}
          </View>
        )}

        {/* 💬 SECTION B: MESSAGES FOUND */}
        {messages.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Messages</Text>
            {messages.map((item: any) => {
              const finalReceiverId = item.partner.id;

              return (
                <TouchableOpacity 
                  key={item.messageId} 
                  style={styles.messageHistoryCard}
                  onPress={() => {
                    navigation.navigate('Chat', { 
                      senderId: currentUserId, 
                      receiverId: finalReceiverId, 
                      receiverName: item.partner.username, 
                      socket,
                      highlightMessageId: item.messageId 
                    });
                  }}
                  activeOpacity={0.6}
                >
                  <View style={styles.msgCardHeader}>
                    <View style={styles.msgHeaderLeft}>
                      <MessageSquare color="#0066FF" size={14} style={{ marginRight: 6 }} />
                      <Text style={styles.partnerNameText}>
                        {item.senderId === currentUserId ? `You ➡️ ${item.partner.fullname || item.partner.username}` : (item.partner.fullname || item.partner.username)}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.msgBodyText} numberOfLines={2}>{item.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 📭 SECTION C: EMPTY PLACES */}
        {query.trim().length > 0 && users.length === 0 && messages.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <MessageCircleX color="#cbd5e1" size={48} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No results found for "{query}"</Text>
            <Text style={styles.emptySubText}>We couldn't find any users or chat messages matching your keyword.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: Platform.OS === 'ios' ? 34 : 24 },
  searchHeaderBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc', marginTop: Platform.OS === 'ios' ? 16 : 32, marginBottom: 15 },
  backBtn: { padding: 4, marginRight: 10 },
  searchBoxWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, position: 'relative' },
  searchIcon: { marginRight: 8 },
  textInputBox: { flex: 1, fontSize: 15, color: '#0f172a', fontFamily: fonts.regular.fontFamily, height: '100%' },
  clearIconBtn: { position: 'absolute', right: 14, padding: 4 },
  clearText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  
  sectionBlock: { marginBottom: 20 },
  sectionTitle: { fontFamily: fonts.bold.fontFamily, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.8, marginLeft: 2 },
  userCardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  
  // Avatar Wrapper (Rounded Square Layout)
  avatarWrapper: { marginRight: 12 },
  avatarImg: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarPlaceholder: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  avatarText: { color: '#0066FF', fontSize: 16, fontFamily: fonts.bold.fontFamily, fontWeight: '700' },
  
  infoBlock: { flex: 1 },
  fullnameText: { fontSize: 15, color: '#1e293b', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600' },
  usernameText: { fontSize: 13, color: '#64748b', fontFamily: fonts.regular.fontFamily, marginTop: 1 },
  
  // Action Buttons Group (Premium Compact Shapes)
  addFriendActionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0066FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  addBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold.fontFamily },
  chatActionBtnReal: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CD964', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  chatBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600', fontFamily: fonts.semiBold.fontFamily },
  
  // Message Card Streams Setup
  messageHistoryCard: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#f1f5f9' },
  msgCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  msgHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  partnerNameText: { fontFamily: fonts.semiBold.fontFamily, fontSize: 14, color: '#334155', fontWeight: '600' },
  timeText: { fontFamily: fonts.regular.fontFamily, fontSize: 11, color: '#94a3b8' },
  msgBodyText: { fontFamily: fonts.regular.fontFamily, fontSize: 14, color: '#0f172a', lineHeight: 21 },
  
  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontFamily: fonts.bold.fontFamily, fontSize: 15, color: '#475569', fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontFamily: fonts.regular.fontFamily, fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 20 }
});