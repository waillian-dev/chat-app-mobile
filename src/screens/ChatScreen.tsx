// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';

// ✨ Premium Lucide Icons
import { Send, ArrowLeft, Search, X } from 'lucide-react-native';

import { API_URL } from '../config';
import { fonts } from '../theme/fonts';
import { RootStackParamList, Message } from '../types';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface Props {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
}

export default function ChatScreen({ route, navigation }: Props) {
  const { senderId, receiverId, receiverName, socket, highlightMessageId } = route.params as any;

  const flatListRef = useRef<FlatList>(null);

  // Status States
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false);

  // Message & Search States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightMessageId || null);

  // In-Room Search States
  const [isSearchingInRoom, setIsSearchingInRoom] = useState<boolean>(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');
  
  // Pagination & Lazy Loading States
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Typing Indicator States
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<any>(null);

  const formatLastSeen = (isoString: string | null) => {
    if (!isoString) return 'Offline';
    const lastSeenDate = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const fetchChatHistory = async (pageNumber: number) => {
    if (!senderId || !receiverId || senderId.length !== 24 || receiverId.length !== 24) {
      setInitialLoading(false);
      return;
    }
    if (loadingHistory || (!hasMore && pageNumber > 1)) return;
    
    setLoadingHistory(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/messages/${senderId}/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNumber, limit: 40 }
      });

      const { messages: fetchedMessages, pagination, partnerLastSeen: serverLastSeen } = response.data;
      if (serverLastSeen) setPartnerLastSeen(serverLastSeen);

      const reversedFetched = [...fetchedMessages].reverse();
      setMessages((prev) => {
        if (pageNumber === 1) return reversedFetched;
        const existingIds = new Set(prev.map(m => m._id));
        const uniqueNewMessages = reversedFetched.filter(m => !existingIds.has(m._id));
        return [...prev, ...uniqueNewMessages];
      });

      setHasMore(pagination.hasMore);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to fetch paginated history:', err);
    } finally {
      setInitialLoading(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification Received');
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      const notiSenderId = data?.senderId as string; 

      if (notiSenderId && notiSenderId !== (receiverId as string)) {
        try {
          const token = await AsyncStorage.getItem('token');
          const userRes = await axios.get(`${API_URL}/chat/conversations/${senderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const conversations = userRes.data.conversations || [];
          const partner = conversations.find((c: any) => c.id === notiSenderId);
          const partnerName = partner ? partner.username : 'Convo User';

          navigation.replace('Chat', { senderId, receiverId: notiSenderId, receiverName: partnerName, socket });
        } catch (err) {
          console.error(err);
        }
      }
    });

    return () => {
      if (foregroundSubscription?.remove) foregroundSubscription.remove();
      if (responseSubscription?.remove) responseSubscription.remove();
    };
  }, [receiverId, senderId, socket, navigation]);

  useEffect(() => {
    fetchChatHistory(1);
    socket.emit('register_user', senderId);
    socket.emit('message_seen', { userId: senderId, partnerId: receiverId });

    const markMessagesAsReadOnServer = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.post(`${API_URL}/chat/mark-as-read`, { userId: senderId, partnerId: receiverId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) { console.log(err); }
    };
    markMessagesAsReadOnServer();
  }, [receiverId]);

  useEffect(() => {
    if (activeHighlightId) {
      const timer = setTimeout(() => { setActiveHighlightId(null); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeHighlightId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = async (msg: Message) => {
      const isCurrentRoomMessage = 
        (msg.senderId === receiverId && msg.receiverId === senderId) || 
        (msg.senderId === senderId && msg.receiverId === receiverId);

      if (isCurrentRoomMessage) {
        setMessages((prevMessages) => {
          if (prevMessages.some(m => m._id === msg._id)) return prevMessages;
          return [msg, ...prevMessages];
        });
        if (msg.senderId === receiverId) {
          socket.emit('message_seen', { userId: senderId, partnerId: receiverId });
        }
      } else {
        if (msg.senderId !== senderId) { 
          try {
            const token = await AsyncStorage.getItem('token');
            const userRes = await axios.get(`${API_URL}/chat/conversations/${senderId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const conversations = userRes.data.conversations || [];
            const partner = conversations.find((c: any) => c.id === msg.senderId);
            const senderNameDisplay = partner ? partner.username : 'Convo User';

            // 🔊 🚀 [အဓိကသော့ချက်] အခန်းပြင်ပမှ စာဝင်လာပါက Custom MP3 အသံဖြင့် In-App Alert မြည်စေရန်
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `💬 New Message from ${senderNameDisplay}`,
                body: msg.message,
                sound: 'default', // iOS အတွက် default ဟု ထားရှိခြင်း
                data: { senderId: msg.senderId, receiverId: msg.receiverId },
              },
              trigger: {
                // 🔊 Android ဖုန်းများပေါ်တွင် app.json နှင့် HomeScreen ၌ ဆောက်ခဲ့သော Custom Sound Channel ID အား ကွက်တိညွှန်ပြခြင်း
                channelId: 'chat-messages', 
              } as any, // Expo Typescript Validation ကျော်ရန် as any ခံနိုင်ပါသည်
            });
          } catch (err) { console.log(err); }
        }
      }
    };

    const handleMessagesSeen = (data: { userId: string, partnerId: string }) => {
      if (data.userId === receiverId && data.partnerId === senderId) {
        setMessages((prevMessages) => prevMessages.map((m) => m.senderId === senderId && m.status !== 'seen' ? { ...m, status: 'seen' } : m));
      }
    };

    socket.on('receive_message', handleIncomingMessage);
    socket.on('message_ack', handleIncomingMessage);
    socket.on('messages_seen_update', handleMessagesSeen);
    socket.on('user_typing', (data: { senderId: string }) => { if (data.senderId === receiverId) setIsPartnerTyping(true); });
    socket.on('user_stop_typing', (data: { senderId: string }) => { if (data.senderId === receiverId) setIsPartnerTyping(false); });
    socket.on('message_deleted', (data: { messageId: string }) => { setMessages((prev) => prev.filter(m => m._id !== data.messageId)); });
    socket.on('user_status_changed', (data: { userId: string, isOnline: boolean, lastSeen: string }) => {
      if (data.userId === receiverId) {
        setIsPartnerOnline(data.isOnline);
        setPartnerLastSeen(data.lastSeen);
      }
    });

    return () => {
      socket.off('receive_message', handleIncomingMessage);
      socket.off('message_ack', handleIncomingMessage);
      socket.off('messages_seen_update', handleMessagesSeen);
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('message_deleted');
      socket.off('user_status_changed');
    };
  }, [receiverId, senderId, socket]);

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    const messageData = { senderId, receiverId, message: inputText.trim(), messageType: 'text' };
    socket.emit('send_message', messageData);
    socket.emit('stop_typing', { senderId, receiverId });
    setInputText('');
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    socket.emit('typing', { senderId, receiverId, senderName: 'Partner' });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { socket.emit('stop_typing', { senderId, receiverId }); }, 2000);
  };

  const handleLongPressMessage = (msg: Message) => {
    if (msg.senderId !== senderId) return;
    Alert.alert('Unsend Message', 'Are you sure you want to unsend this message permanently for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unsend', style: 'destructive', onPress: () => { if (msg._id) socket.emit('delete_message', { messageId: msg._id, senderId, receiverId }); } }
    ]);
  };

  const handleLoadMoreHistory = () => {
    if (hasMore && !loadingHistory) fetchChatHistory(page + 1);
  };

  const handleInRoomSearchJump = (targetText: string) => {
    setRoomSearchQuery(targetText);
    if (targetText.trim() === '') {
      setActiveHighlightId(null);
      return;
    }
    const foundMsg = messages.find(m => m.message.toLowerCase().includes(targetText.toLowerCase()));
    if (foundMsg && foundMsg._id) {
      setActiveHighlightId(foundMsg._id);
      const foundIndex = messages.findIndex(m => m._id === foundMsg._id);
      if (foundIndex !== -1) {
        flatListRef.current?.scrollToIndex({ index: foundIndex, animated: true, viewPosition: 0.5 });
      }
    }
  };

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isMe = item.senderId === senderId;
    const isHighlighted = item._id === activeHighlightId;

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.partnerMessageContainer]}>
        <TouchableOpacity 
          onLongPress={() => handleLongPressMessage(item)}
          activeOpacity={0.9}
          style={[
            styles.bubbleBlock, 
            isMe ? styles.myBubble : styles.partnerBubble,
            isHighlighted && styles.highlightEffect
          ]}
        >
          <Text style={[
            styles.messageText, 
            isMe ? styles.myText : styles.partnerText
          ]}>
            {item.message}
          </Text>
        </TouchableOpacity>
        {isMe && item.status && (
          <Text style={styles.statusTickText}>
            {item.status === 'seen' ? 'Seen' : (item.status === 'delivered' ? '✓✓' : '✓')}
          </Text>
        )}
      </View>
    );
  }, [senderId, activeHighlightId]);

  if (initialLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 👑 TOP PREMIUM NAVBAR */}
      {!isSearchingInRoom ? (
        <View style={styles.chatHeaderBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#0f172a" size={22} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerInfo} 
            onPress={() => navigation.navigate('UserProfile', { targetUserId: receiverId, currentUserId: senderId })}
            activeOpacity={0.6}
          >
            <Text style={styles.partnerNameText}>{receiverName}</Text>
            <Text style={[styles.statusSubText, { color: isPartnerOnline || isPartnerTyping ? '#4CD964' : '#94a3b8' }]}>
              {isPartnerTyping 
                ? "typing..." 
                : (isPartnerOnline ? "Active now" : `Last seen ${formatLastSeen(partnerLastSeen)}`)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchRoomBtn} onPress={() => setIsSearchingInRoom(true)}>
            <Search color="#475569" size={18} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.chatSearchHeaderBar}>
          <View style={styles.searchInnerWrapper}>
            <Search color="#94a3b8" size={16} style={{ marginRight: 8 }} />
            <TextInput 
              style={styles.roomSearchInput}
              placeholder="Search chat history..."
              placeholderTextColor="#94a3b8"
              value={roomSearchQuery}
              onChangeText={handleInRoomSearchJump}
              autoFocus={true}
            />
            <TouchableOpacity onPress={() => { setIsSearchingInRoom(false); handleInRoomSearchJump(''); }}>
              <X color="#64748b" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 💬 MAIN CHAT STREAM SCREEN */}
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted={true} 
        keyExtractor={(item, index) => item._id ? `${item._id}-${index}` : index.toString()} 
        renderItem={renderItem}
        contentContainerStyle={styles.chatStreamList}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMoreHistory}
        onEndReachedThreshold={0.15} 
        removeClippedSubviews={Platform.OS === 'android'} 
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
        }}
        ListHeaderComponent={
          <View>
            {isPartnerTyping && (
              <View style={[styles.messageContainer, styles.partnerMessageContainer, { marginBottom: 10 }]}>
                <View style={[styles.bubbleBlock, styles.partnerBubble, styles.typingBubbleCustom]}>
                  <Text style={styles.typingText}>typing...</Text>
                </View>
              </View>
            )}
            {loadingHistory && <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />}
          </View>
        }
      />

      {/* ⌨️ BOTTOM MODERN INPUT CONTROL BAR (🧼 CLEAN TYPE) */}
      <View style={styles.bottomInputControlBar}>
        <View style={styles.inputGlassWrapper}>
          <TextInput 
            style={styles.textInputBox}
            placeholder="Type your message here..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={handleInputChange}
            multiline={true}
          />
          <TouchableOpacity style={styles.sendIconBtn} onPress={handleSendMessage} activeOpacity={0.8}>
            <Send color="#ffffff" size={15} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'ios' ? 40 : 10 }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  
  // Header Style Layers
  chatHeaderBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc', marginTop: Platform.OS === 'ios' ? 0 : 20 },
  chatSearchHeaderBar: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc', marginTop: Platform.OS === 'ios' ? 0 : 20 },
  searchInnerWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 40, borderRadius: 14, paddingHorizontal: 12 },
  roomSearchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular.fontFamily, color: '#0f172a', height: '100%' },
  backBtn: { padding: 4, marginRight: 10 },
  headerInfo: { flex: 1 },
  partnerNameText: { fontFamily: fonts.bold.fontFamily, fontSize: 16, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
  statusSubText: { fontFamily: fonts.regular.fontFamily, fontSize: 12, marginTop: 1 },
  searchRoomBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  
  // Chat History Bubble Layers
  chatStreamList: { paddingHorizontal: 16, paddingVertical: 12 }, 
  messageContainer: { flexDirection: 'column', marginVertical: 4, maxWidth: '75%' },
  myMessageContainer: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  partnerMessageContainer: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  
  bubbleBlock: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  myBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 }, // Modern Apple Style Asymmetric Edge
  partnerBubble: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  highlightEffect: { backgroundColor: '#f59e0b', opacity: 0.85 },
  
  messageText: { fontSize: 15, fontFamily: fonts.regular.fontFamily, lineHeight: 21 },
  myText: { color: '#ffffff' },
  partnerText: { color: '#0f172a' },
  statusTickText: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginRight: 4, fontFamily: fonts.light.fontFamily },
  typingBubbleCustom: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6 },
  typingText: { fontSize: 13, fontFamily: fonts.regular.fontFamily, color: '#64748b', fontStyle: 'italic' },
  
  // 🧼 Minimalist Input Controls (No emojis/media buttons cluttering)
  bottomInputControlBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  inputGlassWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14, minHeight: 44, maxHeight: 90 },
  textInputBox: { flex: 1, fontSize: 15, color: '#0f172a', fontFamily: fonts.regular.fontFamily, paddingVertical: 6, maxHeight: 70 },
  sendIconBtn: { backgroundColor: '#007AFF', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 6 }
});