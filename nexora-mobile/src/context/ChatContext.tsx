import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Message, Conversation, chatApi } from '../api/chat.api';
import socketService from '../services/socket.service';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  currentScope: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER';
  currentTargetUserId: string | null;
  loadConversations: () => Promise<void>;
  loadMessages: (scope: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER', targetUserId?: string) => Promise<void>;
  sendMessage: (content: string, mediaUrl?: string, type?: 'text' | 'image' | 'file' | 'audio') => Promise<void>;
  markAsRead: () => Promise<void>;
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScope, setCurrentScope] = useState<'INTERNAL' | 'SUPPORT' | 'CUSTOMER'>('CUSTOMER');
  const [currentTargetUserId, setCurrentTargetUserId] = useState<string | null>(null);

  // Connect to WebSocket when user is authenticated and loaded
  useEffect(() => {
    // Only connect if user is fully loaded (not loading) and authenticated
    const timer = setTimeout(() => {
      if (user && !isLoading) {
        connectSocket();
      } else {
        disconnectSocket();
      }
    }, 1000); // Delay connection to ensure auth is complete

    return () => {
      clearTimeout(timer);
      disconnectSocket();
    };
  }, [user, isLoading]);

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = socketService.onMessage((message) => {
      // Add new message to the list if it belongs to current conversation
      if (message.scope === currentScope) {
        if (currentScope === 'CUSTOMER' && message.targetUserId === currentTargetUserId) {
          setMessages((prev) => [...prev, message]);
        } else if (currentScope !== 'CUSTOMER') {
          setMessages((prev) => [...prev, message]);
        }
      }
      // Update unread count
      loadUnreadCount();
    });
    return unsubscribe;
  }, [currentScope, currentTargetUserId]);

  const loadUnreadCount = async () => {
    try {
      const result = await chatApi.getUnreadCount();
      setUnreadCount(result.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const connectSocket = async () => {
    try {
      await socketService.connect();
    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
  };

  const loadConversations = async () => {
    // Superadmin doesn't have tenant-specific conversations
    if (!tenantId || user?.role === 'superadmin') {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await chatApi.getConversations(tenantId);
      setConversations(result);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (scope: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER', targetUserId?: string) => {
    // Superadmin cannot load messages (no tenant-specific chat)
    if (user?.role === 'superadmin') {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setCurrentScope(scope);
    setCurrentTargetUserId(targetUserId || null);
    try {
      const result = await chatApi.getHistory({
        scope,
        targetUserId,
        tenantId,
        limit: 50,
      });
      setMessages(result);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, mediaUrl?: string, type?: 'text' | 'image' | 'file' | 'audio') => {
    const messageData = {
      content,
      scope: currentScope,
      targetUserId: currentTargetUserId || undefined,
      tenantId,
      mediaUrl,
      type: type || 'text',
    };

    // Try to send via WebSocket first
    if (socketService.isConnected()) {
      socketService.sendMessage(messageData);
    } else {
      // Fallback to REST API
      try {
        const newMessage = await chatApi.sendMessage(messageData);
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    }
  };

  const markAsRead = async () => {
    try {
      await chatApi.markAsRead(currentScope, currentTargetUserId || undefined);
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const value: ChatContextType = {
    conversations,
    messages,
    unreadCount,
    isConnected,
    isLoading,
    currentScope,
    currentTargetUserId,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    connectSocket,
    disconnectSocket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;