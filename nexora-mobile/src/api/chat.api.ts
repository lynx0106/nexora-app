import apiClient from './client';

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId?: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tenantId: string;
  scope: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER';
  targetUserId?: string;
  mediaUrl?: string;
  type: 'text' | 'image' | 'file' | 'audio';
  isAi: boolean;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  email: string;
  role: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface SendMessageDto {
  content: string;
  tenantId?: string;
  scope?: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER';
  targetUserId?: string;
  mediaUrl?: string;
  type?: 'text' | 'image' | 'file' | 'audio';
}

class ChatApi {
  /**
   * Get list of conversations (admin/staff only)
   */
  async getConversations(tenantId?: string): Promise<Conversation[]> {
    const params = tenantId ? { tenantId } : {};
    return await apiClient.get<Conversation[]>('/chat/conversations', params);
  }

  /**
   * Get chat history
   */
  async getHistory(options: {
    limit?: number;
    scope?: 'INTERNAL' | 'SUPPORT' | 'CUSTOMER';
    targetUserId?: string;
    tenantId?: string;
  }): Promise<Message[]> {
    return await apiClient.get<Message[]>('/chat/history', options);
  }

  /**
   * Send a message via REST (fallback when WebSocket is not available)
   */
  async sendMessage(data: SendMessageDto): Promise<Message> {
    return await apiClient.post<Message>('/chat/message', data);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(scope: string, targetUserId?: string): Promise<{ success: boolean }> {
    const queryParams = targetUserId 
      ? `?scope=${scope}&targetUserId=${targetUserId}`
      : `?scope=${scope}`;
    return await apiClient.post<{ success: boolean }>(`/chat/mark-read${queryParams}`);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return await apiClient.get<{ count: number }>('/chat/unread');
  }
}

export const chatApi = new ChatApi();
export default chatApi;
