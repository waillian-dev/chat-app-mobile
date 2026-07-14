import { Socket } from 'socket.io-client';

// 👤 User Data Model Interface
export interface User {
  _id?: string;
  id: string;
  fullname: string;
  username: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  birthdate?: string;
}



// 💬 Message Data Model Interface (Backend စနစ်သစ်နှင့် ကိုက်ညီအောင် ပြင်ဆင်ထားသည်)
export interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileNameOriginal?: string;
  fileSize?: number;
  status: 'sent' | 'delivered' | 'seen';
  createdAt: string;
}

// 👥 Chat List Interaction Interface
export interface Conversation {
  id: string;
  username: string;
  fullname: string;
  profileImage: string;
  lastMessage: string;
  updatedAt: string;
  lastSeen?: string;
  unreadCount: number;
  
}

// React Navigation Route Parameters Type Safety
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Otp: { email: string };
  Home: { user: User; token: string };
  Search: { currentUserId: string; socket: Socket };
  Chat: { 
    senderId: string; 
    receiverId: string; 
    receiverName: string; 
    socket: any; 
    highlightMessageId?: string; // 
  };
  Setting: undefined;
  ChangePassword: undefined;
  Friends: undefined;
  UserProfile: {
    targetUserId: string; 
    currentUserId: string; 
  };
  
};

// Bottom Tab Navigation Parameters
export type HomeTabParamList = {
  ChatTab: { user: User };
  Friends: undefined;
  Profile: undefined;
  Setting: undefined;
};