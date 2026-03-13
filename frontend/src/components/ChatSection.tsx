import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import { fetchAPIWithAuth, API_URL } from '../lib/api';
import EmptyState from './ui/EmptyState';
import Skeleton from './ui/Skeleton';

interface Message {
  id: string;
  content: string;
  senderId: string;
  tenantId: string;
  scope: string; // INTERNAL, SUPPORT, CUSTOMER
  targetUserId?: string;
  createdAt: string;
  isAi?: boolean;
  mediaUrl?: string;
  type?: string; // text, image, file
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
  role?: string;
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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Superadmin Tenant Selection - ensure valid default
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenantId || '');

  // Initialize selectedTenantId if superadmin and not set or invalid
  useEffect(() => {
    if (role === 'superadmin' && tenants && tenants.length > 0) {
        const isValid = tenants.find(t => t.id === selectedTenantId);
        if (!isValid || !selectedTenantId) {
            setSelectedTenantId(tenants[0]?.id || '');
        }
    } else if (!role || role !== 'superadmin') {
        setSelectedTenantId(tenantId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedTenantId used to sync; adding it causes init loop
  }, [role, tenants, tenantId]);

  // Handle tenant switch for superadmin - emit switchTenant event
  useEffect(() => {
    if (role === 'superadmin' && selectedTenantId && socketRef.current?.connected) {
      console.log(`[ChatSection] Switching to tenant: ${selectedTenantId}`);
      socketRef.current.emit('switchTenant', { tenantId: selectedTenantId });
    }
  }, [selectedTenantId, role]);

  // Customer Chat State
  const [conversations, setConversations] = useState<User[]>([]);
  const [internalUsers, setInternalUsers] = useState<User[]>([]); // Users in the tenant for internal chat
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // AI State
  const [isAiActive, setIsAiActive] = useState(true);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize Socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      return;
    }

    try {
      const newSocket = io(API_URL, {
        auth: { token: `Bearer ${token}` },
      });

      newSocket.on('connect', () => {
        console.log('[ChatSection] Socket connected');
        setError(null);
        // If superadmin, join the selected tenant's rooms explicitly
        if (role === 'superadmin' && selectedTenantId) {
            console.log(`[ChatSection] Joining rooms for tenant ${selectedTenantId}`);
            newSocket.emit('switchTenant', { tenantId: selectedTenantId });
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('[ChatSection] Socket connection error:', err);
        setError('Connection error');
      });

      newSocket.on('newMessage', (message: Message) => {
        try {
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
        } catch (err) {
          console.error('[ChatSection] Error handling message:', err);
        }
      });
      
      newSocket.on('aiStatusChanged', (payload: { userId: string, isAiActive: boolean }) => {
          try {
              if (selectedCustomerId === payload.userId) {
                  setIsAiActive(payload.isAiActive);
              }
              // Also update list if needed
              setConversations(prev => prev.map(c => c.id === payload.userId ? { ...c, isAiChatActive: payload.isAiActive } : c));
          } catch (err) {
              console.error('[ChatSection] Error handling aiStatusChanged:', err);
          }
      });

      socketRef.current = newSocket;
    } catch (err) {
      console.error('[ChatSection] Error initializing socket:', err);
      setError('Failed to connect');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchConversations in newMessage callback; adding causes socket reconnect each render
  }, [selectedTenantId, activeTab, selectedCustomerId, role]);

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

  // Fetch internal users (team members) when on INTERNAL tab
  const fetchInternalUsers = () => {
      setLoadingConversations(true);
      const tenantQuery = role === 'superadmin' ? `&tenantId=${selectedTenantId}` : '';
      fetchAPIWithAuth(`/chat/users?${tenantQuery}`)
        .then(data => {
            setInternalUsers(data || []);
        })
        .catch(console.error)
        .finally(() => setLoadingConversations(false));
  };

  useEffect(() => {
      if (activeTab === 'CUSTOMER') {
          fetchConversations();
      } else if (activeTab === 'INTERNAL') {
          fetchInternalUsers();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchConversations/fetchInternalUsers stable; adding causes extra fetches
  }, [activeTab, selectedTenantId]);

  // Load History
  useEffect(() => {
    const scope = activeTab;
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
          const sorted = Array.isArray(data) ? data.sort((a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
          setMessages(sorted);
      })
      .catch(console.error);
      
    // Update AI status for selected customer
    if (activeTab === 'CUSTOMER' && selectedCustomerId) {
        const user = conversations.find(c => c.id === selectedCustomerId);
        if (user) setIsAiActive(user.isAiChatActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conversations/role used in conditional; adding causes history refetch loops
  }, [activeTab, selectedCustomerId, conversations.length, selectedTenantId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!newMessage.trim() || !socket) return;

    const payload: Record<string, string | undefined> = {
        content: newMessage,
        scope: activeTab,
    };
    
    // Include tenantId for superadmin
    if (role === 'superadmin' && selectedTenantId) {
        payload.tenantId = selectedTenantId;
    }
    
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
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const socket = socketRef.current;
      if (!file || !socket) return;
      
      // Determine effective tenant ID
      const effectiveTenantId = role === 'superadmin' ? selectedTenantId : tenantId;
      if (!effectiveTenantId) return;
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
          const res = await fetch(`${API_URL}/uploads/chat`, {
              method: 'POST',
              headers: {
                  'x-tenant-id': effectiveTenantId,
              },
              body: formData,
              credentials: 'include',
          });
          
          if (!res.ok) throw new Error('Upload failed');
          
          const data = await res.json();
          const mediaUrl = data.url;
          const type = file.type.startsWith('image/') ? 'image' : 'file';
          
          // Send message with media
          const payload: Record<string, string | undefined> = {
              content: type === 'image' ? '📷 Imagen' : '📎 Archivo',
              scope: activeTab,
              mediaUrl,
              type,
          };
          
          if (role === 'superadmin' && selectedTenantId) {
              payload.tenantId = selectedTenantId;
          }
          
          if (activeTab === 'CUSTOMER' && selectedCustomerId) {
              payload.targetUserId = selectedCustomerId;
          }
          
          socket.emit('sendMessage', payload);
          
      } catch (error) {
          console.error('Error uploading file:', error);
          setError('Error al subir archivo');
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-slate-900/90 border border-slate-800 rounded-lg shadow-sm overflow-hidden">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {/* Sidebar */}
      <div className="w-1/4 bg-slate-800/80 border-r border-slate-700 flex flex-col">
        
        {/* Tenant Selector for Superadmin */}
            {role === 'superadmin' && (
            <div className="p-4 border-b border-slate-700 bg-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('chat.tenant_label')}</label>
                <select 
                    value={selectedTenantId || ''}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full text-sm border-slate-600 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-slate-800 text-slate-100"
                    title="Seleccionar empresa"
                >
                    {(!tenants || tenants.length === 0) ? (
                        <option value="">{t('chat.loading_tenants')}</option>
                    ) : (
                        tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name || t.id}</option>
                        ))
                    )}
                </select>
            </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800">
            <button 
                onClick={() => setActiveTab('INTERNAL')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'INTERNAL' ? 'bg-slate-700 text-teal-300 border-b-2 border-teal-500' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'}`}
            >
                {t('chat.tab_team')}
            </button>
            <button 
                onClick={() => setActiveTab('CUSTOMER')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'CUSTOMER' ? 'bg-slate-700 text-teal-300 border-b-2 border-teal-500' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'}`}
            >
                {t('chat.tab_clients')}
            </button>
            <button 
                onClick={() => setActiveTab('SUPPORT')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'SUPPORT' ? 'bg-slate-700 text-teal-300 border-b-2 border-teal-500' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'}`}
            >
                {t('chat.tab_support')}
            </button>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto bg-slate-800/50">
            {activeTab === 'INTERNAL' && (
                <div className="divide-y divide-gray-200">
                    {loadingConversations && (
                        <div className="p-4 space-y-3">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    )}
                    {!loadingConversations && (!internalUsers || internalUsers.length === 0) && (
                        <div className="p-4 text-gray-600">
                            <EmptyState
                                titulo={t('chat.no_team_members')}
                                descripcion={t('chat.no_team_members_desc')}
                            />
                        </div>
                    )}
                    {internalUsers && internalUsers.map(user => (
                        <div 
                            key={user.id}
                            onClick={() => setSelectedCustomerId(user.id)}
                            className={`p-4 cursor-pointer transition-colors ${selectedCustomerId === user.id ? 'bg-teal-900/40 border-l-4 border-teal-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            <h4 className="font-medium text-sm text-slate-100">{user.firstName} {user.lastName}</h4>
                            <p className="text-xs text-slate-400">{user.email}</p>
                            <span className="inline-block mt-1 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                {(user.role || 'client').toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'SUPPORT' && (
                <div className="p-4 bg-slate-800/50">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100">
                        <h4 className="font-semibold text-amber-900">{t('chat.support_chat_title')}</h4>
                        <p className="text-xs text-amber-700">{t('chat.support_chat_desc')}</p>
                    </div>
                </div>
            )}

            {activeTab === 'CUSTOMER' && (
                <div className="divide-y divide-gray-200 bg-slate-800/50">
                                        {loadingConversations && (
                                            <div className="p-4 space-y-3">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-4 w-2/3" />
                                                <Skeleton className="h-4 w-4/5" />
                                            </div>
                                        )}
                                        {!loadingConversations && (!conversations || conversations.length === 0) && (
                                            <div className="p-4 text-gray-600">
                                                <EmptyState
                                                    titulo={t('chat.no_messages')}
                                                    descripcion={t('chat.select_chat')}
                                                />
                                            </div>
                                        )}
                    {conversations && conversations.map(user => (
                        <div 
                            key={user.id}
                            onClick={() => setSelectedCustomerId(user.id)}
                            className={`p-4 cursor-pointer transition-colors ${selectedCustomerId === user.id ? 'bg-teal-900/40 border-l-4 border-teal-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm text-slate-100">{user.firstName} {user.lastName}</h4>
                                {user.isAiChatActive && <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">IA</span>}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Main Chat Area */}
    <div className="w-3/4 flex flex-col bg-slate-900">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6">
            <div>
                <h3 className="font-semibold text-slate-200">
                    {activeTab === 'INTERNAL' ? t('chat.internal_team') : 
                     activeTab === 'SUPPORT' ? t('chat.technical_support') : 
                     conversations.find(c => c.id === selectedCustomerId)?.firstName || t('chat.select_chat')}
                </h3>
                {activeTab === 'CUSTOMER' && selectedCustomerId && (
                     <span className={`text-xs flex items-center gap-1 ${isAiActive ? 'text-teal-400' : 'text-slate-400'}`}>
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
                        ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' 
                        : 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700'
                    }`}
                >
                    {isAiActive ? t('chat.pause_ai') : t('chat.reactivate_ai')}
                </button>
            )}
        </div>

        {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-800/50 min-h-[200px]">
                         {(!messages || messages.length === 0) && (
                                <div className="flex h-full items-center justify-center">
                                    <EmptyState
                                        titulo={t('chat.no_messages')}
                                        descripcion={
                                            activeTab === 'CUSTOMER' && !selectedCustomerId
                                                ? t('chat.select_chat')
                                                : t('chat.input_placeholder')
                                        }
                                    />
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
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
                  }`}>
                    {!isMe && (
                      <div className={`text-xs mb-1 font-bold ${isAi ? 'text-teal-400' : 'text-slate-400'}`}>
                        {isAi ? t('chat.virtual_assistant') : (msg.sender?.firstName || t('chat.user_label'))}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    {/* Display attached image */}
                    {msg.type === 'image' && msg.mediaUrl && (
                        <div className="relative mt-2 w-full max-w-sm aspect-video">
                          <Image 
                            src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_URL}${msg.mediaUrl}`}
                            alt={t('chat.image_attachment') || 'Imagen adjunta'} 
                            fill
                            className="object-cover rounded-md"
                            sizes="(max-width: 384px) 100vw, 384px"
                            unoptimized={msg.mediaUrl.startsWith('blob:')}
                          />
                        </div>
                    )}
                    {/* Display file attachment */}
                    {msg.type === 'file' && msg.mediaUrl && (
                        <a 
                            href={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_URL}${msg.mediaUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 mt-2 text-teal-400 hover:text-teal-300 underline text-xs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t('chat.download_file') || 'Descargar archivo'}
                        </a>
                    )}
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-teal-300' : 'text-slate-400'} text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-900">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                {/* File Upload Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2 text-slate-400 hover:text-teal-400 disabled:opacity-50 transition-colors"
                    title="Subir archivo"
                >
                    {isUploading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    )}
                </button>
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('chat.input_placeholder')}
                    className="flex-1 border-slate-600 rounded-md focus:ring-teal-500 focus:border-teal-500"
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
