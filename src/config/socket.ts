// src/config/socket.ts
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './index';

class SocketService {
  public socket: Socket | null = null;

  // Socket ဆက်သွယ်မှု စတင်ရန်
  connect(userId: string) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      this.socket.emit('register_user', userId);
      console.log(`⚡ Global Socket Connected & Registered for User: ${userId}`);
    }
    return this.socket;
  }

  // Socket ဖြတ်တောက်ရန်
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Global Socket Disconnected.');
    }
  }

  // လက်ရှိ Socket Instance ကို ယူရန်
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();