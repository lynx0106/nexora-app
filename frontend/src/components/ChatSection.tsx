import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import { fetchAPIWithAuth, API_URL } from '../lib/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  tenantId: string;
  scope: string; // INTERNAL, SUPPORT, CUSTOMER
  targetUserId?: string;
  createdAt: string;
  isAi?: boolean;
  sender?: {
    firstName: string;
    lastName: string;
  }
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAiChatActive: boolean;
}

interface ChatSectionProps {
  role: string | null;
  currentUserId: string | null;
  tenantId: string;
  tenants?: { id: string; name: string }[];
}

export function ChatSection({ role, currentUserId, tenantId, tenants = [] }: ChatSectionProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'INTERNAL' | 'SUPPORT' | 'CUSTOMER'>('INTERNAL');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Superadmin Tenant Selection
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenantId);

  // Initialize selectedTenantId if superadmin and not set or invalid
  useEffect(() => {
    if (role === 'superadmin' && tenants.length > 0) {
        const isValid = tenants.find(t => t.id === selectedTenantId);
        if (!isValid) {
            setSelectedTenantId(tenants[0].id);
        }
    } else if (role !== 'superadmin') {
        setSelectedTenantId(tenantId);
    }
  }, [role, tenants, tenantId]);

  // Customer Chat State
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // AI State
  const [isAiActive, setIsAiActive] = useState(true);

  // Initialize Socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: { token: `Bearer ${token}` },
    });

    newSocket.on('connect', () => {
      console.log('[ChatSection] Socket connected');
      // If superadmin, join the selected tenant's rooms explicitly
      if (role === 'superadmin' && selectedTenantId) {
          console.log(`[ChatSection] Joining rooms for tenant ${selectedTenantId}`);
          newSocket.emit('joinRoom', `tenant-${selectedTenantId}-INTERNAL`);
          newSocket.emit('joinRoom', `tenant-${selectedTenantId}-customers-all`);
      }
    });

    newSocket.on('newMessage', (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.id === message.id)) return prev;
        
        // Filter: Only add if it belongs to current view AND current selected tenant
        if (role === 'superadmin' && message.tenantId !== selectedTenantId) {
            return prev; // Ignore messages from other tenants while viewing one
        }

        // 1. If Internal/Support, just add
        if (activeTab === 'INTERNAL' && message.scope === 'INTERNAL') return [...prev, message];
        if (activeTab === 'SUPPORT' && message.scope === 'SUPPORT') return [...prev, message];
        
        // 2. If Customer, only add if belongs to selected customer
        if (activeTab === 'CUSTOMER' && message.scope === 'CUSTOMER') {
            // If we are viewing this customer, add it
            if (message.senderId === selectedCustomerId || message.targetUserId === selectedCustomerId) {
                return [...prev, message];
            }
            // If not, we should update the conversations list (unread indicator - todo)
            // For now, let's just refresh the conversations list to ensure order/existence
            fetchConversations(); 
            return prev;
        }
        
        return prev;
      });
    });
    
    newSocket.on('aiStatusChanged', (payload: { userId: string, isAiActive: boolean }) => {
        if (selectedCustomerId === payload.userId) {
            setIsAiActive(payload.isAiActive);
        }
        // Also update list if needed
        setConversations(prev => prev.map(c => c.id === payload.userId ? { ...c, isAiChatActive: payload.isAiActive } : c));
    });

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selectedTenantId, activeTab, selectedCustomerId, role]); // Re-bind if tenant changes? Actually socket is global, filtering is local.

  // Load Conversations when on Customer Tab
  const fetchConversations = () => {
      setLoadingConversations(true);
      const tenantQuery = role === 'superadmin' ? `&tenantId=${selectedTenantId}` : '';
      fetchAPIWithAuth(`/chat/conversations?${tenantQuery}`)
        .then(data => {
            setConversations(data || []);
            // Auto-select first if none selected
            if (!selectedCustomerId && data && data.length > 0) {
                setSelectedCustomerId(data[0].id);
                setIsAiActive(data[0].isAiChatActive);
            }
        })
        .catch(console.error)
        .finally(() => setLoadingConversations(false));
  };

  useEffect(() => {
      if (activeTab === 'CUSTOMER') {
          fetchConversations();
      } else {
          // Reset customer selection when changing tabs? Maybe not, keep state.
          // But clear messages? Yes, messages depend on scope.
      }
  }, [activeTab, selectedTenantId]);

  // Load History
  useEffect(() => {
    let scope = activeTab;
    let targetId = undefined;

    if (activeTab === 'CUSTOMER') {
        if (!selectedCustomerId) {
            setMessages([]);
            return;
        }
        targetId = selectedCustomerId;
    }

    const tenantQuery = role === 'superadmin' ? `&tenantId=${selectedTenantId}` : '';
    fetchAPIWithAuth(`/chat/history?limit=50&scope=${scope}${targetId ? `&targetUserId=${targetId}` : ''}${tenantQuery}`)
      .then((data) => {
          const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
          setMessages(sorted);
      })
      .catch(console.error);
      
    // Update AI status for selected customer
    if (activeTab === 'CUSTOMER' && selectedCustomerId) {
        const user = conversations.find(c => c.id === selectedCustomerId);
        if (user) setIsAiActive(user.isAiChatActive);
    }

  }, [activeTab, selectedCustomerId, conversations.length, selectedTenantId]); // Dependencies

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!newMessage.trim() || !socket) return;

    const payload: any = { 
        content: newMessage,
        scope: activeTab,
    };
    
    if (activeTab === 'CUSTOMER') {
        if (!selectedCustomerId) return;
        payload.targetUserId = selectedCustomerId;
    }

    socket.emit('sendMessage', payload);
    setNewMessage('');
  };

  const toggleAi = () => {
      const socket = socketRef.current;
      if (!socket || !selectedCustomerId) return;
      const newState = !isAiActive;
      socket.emit('toggleAi', { userId: selectedCustomerId, isActive: newState });
      // Optimistic update
      setIsAiActive(newState);
      setConversations(prev => prev.map(c => c.id === selectedCustomerId ? { ...c, isAiChatActive: newState } : c));
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
        
        {/* Tenant Selector for Superadmin */}
            {role === 'superadmin' && (
            <div className="p-4 border-b border-gray-200 bg-zinc-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('chat.tenant_label')}</label>
                <select 
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    {tenants.length === 0 ? (
                        <option value="">{t('chat.loading_tenants')}</option>
                    ) : (
                        tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))
                    )}
                </select>
            </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('INTERNAL')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'INTERNAL' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t('chat.tab_team')}
            </button>
            <button 
                onClick={() => setActiveTab('CUSTOMER')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'CUSTOMER' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t('chat.tab_clients')}
            </button>
            <button 
                onClick={() => setActiveTab('SUPPORT')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'SUPPORT' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t('chat.tab_support')}
            </button>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto">
            {activeTab === 'INTERNAL' && (
                <div className="p-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg cursor-pointer">
                        <h4 className="font-semibold text-indigo-900">{t('chat.team_chat_title')}</h4>
                        <p className="text-xs text-indigo-700">{t('chat.team_chat_desc')}</p>
                    </div>
                </div>
            )}
            
            {activeTab === 'SUPPORT' && (
                <div className="p-4">
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg cursor-pointer">
                        <h4 className="font-semibold text-amber-900">{t('chat.support_chat_title')}</h4>
                        <p className="text-xs text-amber-700">{t('chat.support_chat_desc')}</p>
                    </div>
                </div>
            )}

            {activeTab === 'CUSTOMER' && (
                <div className="divide-y divide-gray-100">
                    {loadingConversations && <p className="p-4 text-xs text-gray-400">{t('chat.loading_conversations')}</p>}
                    {!loadingConversations && conversations.length === 0 && (
                        <p className="p-4 text-xs text-gray-400">{t('chat.no_messages')}</p>
                    )}
                    {conversations.map(user => (
                        <div 
                            key={user.id}
                            onClick={() => setSelectedCustomerId(user.id)}
                            className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${selectedCustomerId === user.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm text-gray-900">{user.firstName} {user.lastName}</h4>
                                {user.isAiChatActive && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">IA</span>}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-3/4 flex flex-col bg-white">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6">
            <div>
                <h3 className="font-semibold text-gray-800">
                    {activeTab === 'INTERNAL' ? t('chat.internal_team') : 
                     activeTab === 'SUPPORT' ? t('chat.technical_support') : 
                     conversations.find(c => c.id === selectedCustomerId)?.firstName || t('chat.select_chat')}
                </h3>
                {activeTab === 'CUSTOMER' && selectedCustomerId && (
                     <span className={`text-xs flex items-center gap-1 ${isAiActive ? 'text-purple-600' : 'text-gray-500'}`}>
                        {isAiActive ? t('chat.ai_responding') : t('chat.manual_mode')}
                     </span>
                )}
            </div>
            
            {/* Actions */}
            {activeTab === 'CUSTOMER' && selectedCustomerId && (
                <button 
                    onClick={toggleAi}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        isAiActive 
                        ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' 
                        : 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700'
                    }`}
                >
                    {isAiActive ? t('chat.pause_ai') : t('chat.reactivate_ai')}
                </button>
            )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
             {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    {t('chat.no_messages')}
                </div>
             )}
             
             {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const isAi = msg.isAi;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : isAi
                        ? 'bg-purple-100 border border-purple-200 text-purple-900 rounded-bl-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {!isMe && (
                      <div className={`text-xs mb-1 font-bold ${isAi ? 'text-purple-700' : 'text-gray-500'}`}>
                        {isAi ? t('chat.virtual_assistant') : (msg.sender?.firstName || t('chat.user_label'))}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('chat.input_placeholder')}
                    className="flex-1 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
                >
                    {t('chat.send')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
