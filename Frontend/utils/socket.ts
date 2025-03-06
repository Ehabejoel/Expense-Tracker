import io, { Socket } from 'socket.io-client';
import { API_URL } from '@/config/api';

class SocketService {
  private static instance: SocketService;
  socket: Socket | null = null;
  connectionPromise: Promise<Socket> | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): Promise<Socket> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Remove /api from the URL for socket connection
    const socketUrl = API_URL.replace('/api', '');

    this.connectionPromise = new Promise((resolve, reject) => {
      console.log('Connecting to socket namespace:', `${socketUrl}/reminders`);
      
      this.socket = io(`${socketUrl}/reminders`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected successfully to reminders namespace');
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      // Set a timeout for the connection
      setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 5000);
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
  }

  async getSocket(): Promise<Socket | null> {
    try {
      if (this.socket?.connected) {
        return this.socket;
      }
      return await this.connect();
    } catch (error) {
      console.error('Failed to get socket:', error);
      return null;
    }
  }
}

export const socketService = SocketService.getInstance();
