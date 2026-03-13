import { io, Socket } from 'socket.io-client';
import { Message } from '../api/chat.api';
import apiClient from '../api/client';
import { API_URL } from '../config/api.config';

// WebSocket usa la misma URL base que la API (3104 en producción)

type MessageCallback = (message: Message) => void;
type ConnectionCallback = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    try {
      if (this.socket?.connected) {
        return;
      }

      const token = await apiClient.getToken();
      if (!token) {
        if (__DEV__) console.warn('No token available for WebSocket connection');
        return;
      }

      this.socket = io(API_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      this.setupListeners();
    } catch (error) {
      if (__DEV__) console.error('Error initializing WebSocket connection:', error);
      this.connected = false;
      this.notifyConnectionCallbacks(false);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      if (__DEV__) console.log('WebSocket connected');
      this.connected = true;
      this.notifyConnectionCallbacks(true);
    });

    this.socket.on('disconnect', () => {
      if (__DEV__) console.log('WebSocket disconnected');
      this.connected = false;
      this.notifyConnectionCallbacks(false);
    });

    this.socket.on('connect_error', (error) => {
      if (__DEV__) console.error('WebSocket connection error:', error.message);
      this.connected = false;
      this.notifyConnectionCallbacks(false);
    });

    // Listen for new messages
    this.socket.on('newMessage', (message: Message) => {
      if (__DEV__) console.log('New message received:', message.id);
      this.messageCallbacks.forEach((callback) => callback(message));
    });

    // Listen for messages sent to customer room
    this.socket.on('message', (message: Message) => {
      if (__DEV__) console.log('Message received:', message.id);
      this.messageCallbacks.forEach((callback) => callback(message));
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.notifyConnectionCallbacks(false);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Join a specific conversation room
   */
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinConversation', { conversationId });
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveConversation', { conversationId });
    }
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(data: {
    content: string;
    scope?: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER';
    targetUserId?: string;
    tenantId?: string;
    mediaUrl?: string;
    type?: 'text' | 'image' | 'file' | 'audio';
  }): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', data);
    }
  }

  /**
   * Subscribe to new messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }
}

export const socketService = new SocketService();
export default socketService;
