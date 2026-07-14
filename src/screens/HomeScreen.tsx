// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  Image, 
  Platform, 
  Animated,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, RouteProp } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { MessageSquare, Users, User as UserIcon, Settings, Search } from 'lucide-react-native';
import { API_URL } from '../config';
import { socketService } from '../config/socket';
import { fonts } from '../theme/fonts';
import { RootStackParamList, HomeTabParamList, User, Conversation } from '../types';

import FriendsScreen from './FriendsScreen';
import ProfileScreen from './ProfileScreen';
import SettingScreen from './SettingScreen';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 48; // Left/Right Padding ခွာထားသော အကျယ်
const TAB_WIDTH = TAB_BAR_WIDTH / 4; // Tab တစ်ခုချင်းစီ၏ အကျယ်

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

const Tab = createBottomTabNavigator<HomeTabParamList>();

interface ChatListTabProps {
  route: RouteProp<HomeTabParamList, 'ChatTab'>;
  navigation: StackNavigationProp<RootStackParamList>;
}

// ========================================================
// HEADER COMPONENT
// ========================================================
interface HomeHeaderProps {
  user: User;
  onSearchPress: () => void;
  onProfilePress: () => void;
}
function HomeHeader({ user, onSearchPress, onProfilePress }: HomeHeaderProps) {
  return (
    <View style={styles.headerBar}>
      <TouchableOpacity style={styles.headerAvatarBtn} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.headerAvatarImg}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.headerAvatarImg} />
          ) : (
            <Text style={styles.headerAvatarText}>{user.username[0]?.toUpperCase() || 'U'}</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <Text style={styles.headerAppName}>Convo</Text>

      <TouchableOpacity style={styles.headerSearchBtn} onPress={onSearchPress} activeOpacity={0.7}>
        <Search color="#0f172a" size={20} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

// ========================================================
// ACTIVE PROFILES LIST COMPONENT
// ========================================================
interface ActiveUsersListProps {
  friendsList: any[];
  onlineUserIds: string[];
  currentUserId: string;
  navigation: StackNavigationProp<RootStackParamList>;
}
function ActiveUsersList({ friendsList, onlineUserIds, currentUserId, navigation }: ActiveUsersListProps) {
  const onlineFriends = friendsList.filter(f => onlineUserIds.includes((f.id || f._id)?.toString()));

  if (onlineFriends.length === 0) return null;

  return (
    <View style={styles.activeSectionWrapper}>
      <Text style={styles.sectionTitle}>Active Now</Text>
      <FlatList
        data={onlineFriends}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => (item.id || item._id).toString()}
        contentContainerStyle={styles.activeHorizontalList}
        renderItem={({ item }) => {
          const itemId = (item.id || item._id).toString();
          return (
            <TouchableOpacity 
              style={styles.activeUserCard}
              activeOpacity={0.7}
              onPress={() => {
                const activeSocket = socketService.getSocket();
                if (activeSocket) {
                  navigation.navigate('Chat', { 
                    senderId: currentUserId, 
                    receiverId: itemId, 
                    receiverName: item.username, 
                    socket: activeSocket 
                  });
                }
              }}
            >
              <View style={styles.activeAvatarOuterRing}>
                <View style={styles.activeAvatarInnerWrapper}>
                  {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.activeAvatarImg} />
                  ) : (
                    <Text style={styles.activeAvatarText}>{item.username[0]?.toUpperCase() || 'U'}</Text>
                  )}
                </View>
                <View style={styles.activeGreenDot} />
              </View>
              <Text style={styles.activeUsernameText} numberOfLines={1}>
                {item.fullname || item.username}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ========================================================
// CHAT LIST TAB COMPONENT (MAIN BODY)
// ========================================================
function ChatListTab({ route, navigation }: ChatListTabProps) {
  const { user } = route.params;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]); 
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const convRes = await axios.get(`${API_URL}/chat/conversations/${user.id}`, config);
      setConversations(convRes.data.conversations || (Array.isArray(convRes.data) ? convRes.data : []));

      const friendRes = await axios.get(`${API_URL}/friend/list/${user.id}`, config);
      setFriendsList(friendRes.data.friends || []);
    } catch (err) {
      console.error('Fetch home data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    const socket = socketService.connect(user.id);
    if (!socket) return;
    
    socket.on('get_online_users', (userIds: string[]) => {
      setOnlineUserIds(userIds);
    });

    const handleLiveUpdate = (incomingMessage: any) => {
      setConversations((prevConversations) => {
        const partnerId = incomingMessage.senderId === user.id ? incomingMessage.receiverId : incomingMessage.senderId;
        const existingChatIndex = prevConversations.findIndex(c => c.id === partnerId);
        let updatedChats = [...prevConversations];

        if (existingChatIndex !== -1) {
          const targetChat = updatedChats[existingChatIndex];
          updatedChats.splice(existingChatIndex, 1);
          
          // 💡 ✨ [အဓိကသော့ချက်] Socket မှကျလာသော incomingMessage.message သည် မူရင်းစာသားအမှန် (Plain Text) ဖြစ်၍ 
          // Recent Chat UI စာရင်းပေါ်တွင် လှလှပပ တန်းပြနိုင်ရန်အတွက် ၎င်းအတိုင်း တိုက်ရိုက် Assign ချပေးလိုက်ခြင်း ဖြစ်ပါတယ်ဗျာ။
          updatedChats.unshift({
            ...targetChat,
            lastMessage: incomingMessage.message, // 🔓 Plain text အမှန်အတိုင်း တန်းပြမည်
            updatedAt: incomingMessage.createdAt,
            unreadCount: incomingMessage.senderId === partnerId ? (targetChat.unreadCount || 0) + 1 : (targetChat.unreadCount || 0)
          });
        } else {
          // စကားပြောဖူးသည့် စာရင်းထဲတွင် မရှိသေးသော ယူဆာအသစ်ဖြစ်ပါက API အား နောက်ကွယ်မှ ပြန်ခေါ်၍ Refresh လုပ်ပေးခြင်း
          fetchData();
        }
        return updatedChats;
      });
    };

    const handleSeenUpdate = (data: { userId: string, partnerId: string }) => {
      setConversations((prevConversations) => 
        prevConversations.map((c) => data.userId === user.id && c.id === data.partnerId ? { ...c, unreadCount: 0 } : c)
      );
    };

    socket.on('user_status_changed', (data: { userId: string, isOnline: boolean, lastSeen: string }) => {
      setConversations((prevConversations) => 
        prevConversations.map((c) => c.id === data.userId ? { ...c, lastSeen: data.lastSeen } : c)
      );
      setFriendsList((prevFriends) => 
        prevFriends.map((f) => (f.id || f._id)?.toString() === data.userId ? { ...f, lastSeen: data.lastSeen } : f)
      );
    });

    socket.on('receive_message', handleLiveUpdate);
    socket.on('message_ack', handleLiveUpdate);
    socket.on('messages_seen_update', handleSeenUpdate);

    return () => {
      socket.off('receive_message', handleLiveUpdate);
      socket.off('message_ack', handleLiveUpdate);
      socket.off('messages_seen_update', handleSeenUpdate);
      socket.off('user_status_changed');
      socket.off('get_online_users');
    };
  }, [user.id]);

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <HomeHeader 
        user={user}
        onSearchPress={() => {
          const activeSocket = socketService.getSocket();
          if (activeSocket) navigation.navigate('Search', { currentUserId: user.id, socket: activeSocket });
        }}
        onProfilePress={() => navigation.navigate('Profile' as any)}
      />

      <ActiveUsersList 
        friendsList={friendsList}
        onlineUserIds={onlineUserIds}
        currentUserId={user.id}
        navigation={navigation}
      />

      <Text style={styles.sectionTitle}>Recent Chats</Text>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyWelcomeBlock}>
          <View style={styles.emptyBadgeCircle}>
            <MessageSquare color="#007AFF" size={28} />
          </View>
          <Text style={styles.emptyTitleText}>Start a Conversation</Text>
          <Text style={styles.emptyDescText}>Your message logs are clean. Go to the contacts tab or search to start chatting.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isOnline = onlineUserIds.includes(item.id.toString());
            const hasUnread = item.unreadCount > 0;

            return (
              <TouchableOpacity 
                style={styles.userCard}
                onPress={() => {
                  const activeSocket = socketService.getSocket();
                  if (activeSocket) {
                    navigation.navigate('Chat', { 
                      senderId: user.id, 
                      receiverId: item.id, 
                      receiverName: item.username, 
                      socket: activeSocket 
                    });
                  }
                }}
                activeOpacity={0.6}
              >
                <View style={styles.avatarContainer}>
                  {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.userAvatarImg} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{item.username[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                  )}
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CD964' : '#cbd5e1' }]} />
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.row}>
                    <Text style={[styles.username, hasUnread && styles.boldText]} numberOfLines={1}>
                      {item.fullname || item.username}
                    </Text>
                    <Text style={[styles.timeText, hasUnread && styles.unreadTimeText]}>
                      {formatTime(item.updatedAt)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.lastMessage, hasUnread && styles.unreadMessageText]} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

// ========================================================
// ✨ CUSTOM FLUID MOTION BOTTOM TAB BAR COMPONENT
// ========================================================
function MotionTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // အကွက်ရွှေ့ရန်အတွက် Animated Value ကို ပထမဦးဆုံး State တည်ဆောက်ချိန်တွင် Init လုပ်သည်
  const animationX = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;

  useEffect(() => {
    // Tab ပြောင်းလဲသွားတိုင်း ညင်သာစွာ Slide ဖြစ်ပြီး ရွေ့လျားသွားမယ့် Spring Physics Animation
    Animated.spring(animationX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      // bounces: true,
      damping: 15,
      mass: 0.8,
      stiffness: 140
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabContainerOuter}>
      <View style={styles.tabBarContainer}>
        
        {/* 👇 Background Fluid Motion Active Box Indicator */}
        <Animated.View 
          style={[
            styles.animatedIndicator,
            { transform: [{ translateX: animationX }] }
          ]} 
        />

        {/* Individual Tab Icons Mapping */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = isFocused ? '#ffffff' : '#94a3b8';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.iconScaleWrapper,
                { transform: [{ scale: isFocused ? 1.15 : 1.0 }] } // Focus ဖြစ်စဉ် အရွယ်အစား အနည်းငယ် ကြွလာမည်
              ]}>
                {route.name === 'ChatTab' && <MessageSquare color={color} size={22} strokeWidth={isFocused ? 2.5 : 2} />}
                {route.name === 'Friends' && <Users color={color} size={22} strokeWidth={isFocused ? 2.5 : 2} />}
                {route.name === 'Profile' && <UserIcon color={color} size={22} strokeWidth={isFocused ? 2.5 : 2} />}
                {route.name === 'Setting' && <Settings color={color} size={22} strokeWidth={isFocused ? 2.5 : 2} />}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ==========================================
// MAIN NAVIGATION WRAPPER COMPONENT
// ==========================================
export default function HomeScreen({ route }: any) {
  const { user } = route.params;

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('ℹ️ Emulator/Simulator detected. Skipping Native FCM Token registration.');
      return;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('⚠️ Notification permissions denied.');
      return;
    }

    try {
      // 🚀 ✨ [အဓိကသော့ချက်] Expo SDK Environment တွင် Native FCM Token ကို စိတ်အချရဆုံး ထုတ်ယူသည့် စနစ်သစ်
      // projectId အား အလိုအလျောက် သတ်မှတ်ခိုင်းပြီး အောက်ပါအတိုင်း ရှင်းလင်းစွာ ခေါ်ယူရပါမည်။
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      const fcmToken = deviceTokenData.data; // ရရှိလာမည့် Firebase Cloud Messaging Token စစ်စစ်

      if (!fcmToken) {
        throw new Error("Generated FCM Token is empty or undefined.");
      }

      const sessionToken = await AsyncStorage.getItem('token');
      
      // Android Custom Sound Channel Setup (မူရင်းအတိုင်း ထားရှိပါသည်)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('chat-messages', {
          name: 'Chat Messages',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          bypassDnd: true,
          sound: 'notisound', // app.json ရှိ သတ်မှတ်ချက်နှင့် ကိုက်ညီသော နာမည်
        });
      }

      // 🚀 ရလာသော FCM Direct Token အား Backend Database သို့ သွားရောက်အပ်နှံခြင်း
      await axios.post(`${API_URL}/auth/save-push-token`, {
        userId: user.id,
        pushToken: fcmToken // ✨ သန့်ရှင်းသော FCM Token အား တင်ပို့ခြင်း
      }, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      
      console.log('🔥 Native FCM Token saved to DB successfully:', fcmToken);

    } catch (error: any) {
      console.error('❌ Push registration error (FCM Token Fetch Failed):', error.message || error);
    }
  };

  useEffect(() => {
    if (user && user.id) registerForPushNotificationsAsync();
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Tab.Navigator
        // 👇 အဓိက သော့ချက် - Custom Motion Tab Bar Component အား လမ်းကြောင်းချိတ်ဆက်ခြင်း
        tabBar={(props) => <MotionTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="ChatTab" component={ChatListTab} initialParams={{ user }} />
        <Tab.Screen name="Friends" component={FriendsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Setting" component={SettingScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: Platform.OS === 'ios' ? 34 : 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  
  // Header UI
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginTop: Platform.OS === 'ios' ? 16 : 32, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  headerAvatarBtn: { width: 40, height: 40, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f0f7ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  headerAvatarImg: { width: '100%', height: '100%' },
  headerAvatarText: { color: '#007AFF', fontSize: 16, fontFamily: fonts.bold.fontFamily, fontWeight: '700' },
  headerAppName: { fontFamily: fonts.bold.fontFamily, fontSize: 24, fontWeight: '700', color: '#007AFF', letterSpacing: -0.6 },
  headerSearchBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  
  // Section Setup
  sectionTitle: { fontFamily: fonts.bold.fontFamily, fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 12, marginTop: 18, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 2 },
  
  // Active Horizontal Stories
  activeSectionWrapper: { borderBottomWidth: 1, borderBottomColor: '#f8fafc', paddingBottom: 6 },
  activeHorizontalList: { paddingLeft: 2 },
  activeUserCard: { alignItems: 'center', marginRight: 16, width: 64 },
  activeAvatarOuterRing: { width: 54, height: 54, borderRadius: 20, borderWidth: 2, borderColor: '#007AFF', padding: 2, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 6 },
  activeAvatarInnerWrapper: { width: '100%', height: '100%', borderRadius: 16, backgroundColor: '#f1f5f9', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  activeAvatarImg: { width: '100%', height: '100%' },
  activeAvatarText: { fontSize: 16, color: '#64748b', fontFamily: fonts.bold.fontFamily },
  activeGreenDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CD964', position: 'absolute', bottom: -1, right: -1, borderWidth: 2, borderColor: '#ffffff' },
  activeUsernameText: { fontSize: 12, color: '#334155', fontFamily: fonts.regular.fontFamily, textAlign: 'center', width: '100%' },

  // Vertical Recent Chats
  userCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  avatarContainer: { position: 'relative', marginRight: 14 },
  userAvatarImg: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  avatarText: { color: '#007AFF', fontSize: 18, fontFamily: fonts.bold.fontFamily, fontWeight: '700' },
  statusDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: -1, right: -1, borderWidth: 2, borderColor: '#ffffff' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  username: { fontSize: 15, color: '#1e293b', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600', maxWidth: '70%' },
  boldText: { fontWeight: '700', color: '#0f172a' },
  timeText: { fontSize: 11, color: '#94a3b8', fontFamily: fonts.regular.fontFamily },
  unreadTimeText: { color: '#007AFF', fontWeight: '600' },
  lastMessage: { fontSize: 13, color: '#64748b', flex: 1, marginRight: 10, fontFamily: fonts.regular.fontFamily },
  unreadMessageText: { color: '#0f172a', fontWeight: '600' },
  unreadBadge: { backgroundColor: '#007AFF', borderRadius: 8, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  unreadBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  emptyWelcomeBlock: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginVertical: 40 },
  emptyBadgeCircle: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#f0f7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#bfdbfe' },
  emptyTitleText: { fontFamily: fonts.bold.fontFamily, fontSize: 16, color: '#0f172a', marginBottom: 6 },
  emptyDescText: { fontFamily: fonts.regular.fontFamily, fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  // ==========================================
  // ✨ MOTION TAB MENU STYLES
  // ==========================================
  tabContainerOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 24,
    right: 24,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    width: TAB_BAR_WIDTH,
    height: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4 
  },
  animatedIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: TAB_WIDTH - 8,
    height: 62 - 10,
    backgroundColor: '#007AFF', // Active Box အရောင်ရင့်
    borderRadius: 18,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 2, // Icons များ ပုံရိပ်အနောက် မရောက်စေရန်
  },
  iconScaleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});