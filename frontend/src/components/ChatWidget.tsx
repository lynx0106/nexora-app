import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchAPIWithAuth, API_URL, uploadFile } from '../lib/api';
import { useTranslation } from 'react-i18next';

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

interface ChatWidgetProps {
  token: string | null;
  currentUserId: string | null;
  role?: string | null;
}

export function ChatWidget({ token, currentUserId, role }: ChatWidgetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState<'INTERNAL' | 'SUPPORT' | 'CUSTOMER'>('INTERNAL');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Determine available tabs based on role
  // If user is 'user' (client), they only have 'CUSTOMER' (chat with business)
  // If user is 'admin', they have 'INTERNAL', 'SUPPORT', 'CUSTOMER'
  // If user is 'superadmin', they have 'SUPPORT' (Global) mainly.
  
  const [activeCustomerAi, setActiveCustomerAi] = useState<boolean>(true); // Track AI status for current view
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null); // Track which user we are talking to in Admin view

  const [tenantInfo, setTenantInfo] = useState<{ name: string; sector: string } | null>(null);

  // Initialize default tab
  useEffect(() => {
    if (role === 'user') {
        setActiveTab('CUSTOMER');
    } else {
        setActiveTab('INTERNAL');
    }
  }, [role]);

  // Fetch Tenant Info for bot identity
  useEffect(() => {
    if (!token) return;
    
    // Extract tenantId from token to fetch public info or use an endpoint
    // For now, let's use the public endpoint if we can parse the token, 
    // or assume we are in the context of the current dashboard.
    // DashboardPage passes currentUserId but not tenantId explicitly to ChatWidget.
    // We can decode the token here again or pass it as prop.
    // Let's decode safely.
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tId = payload.tenantId;
        if (tId) {
            fetchAPIWithAuth(`/public/tenant/${tId}`)
                .then(data => {
                    if (data) {
                        setTenantInfo({ name: data.name, sector: data.sector || 'Negocio' });
                    } else {
                        setTenantInfo({ name: 'nuestro negocio', sector: 'Servicios' });
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch tenant info for chat", err);
                    setTenantInfo({ name: 'nuestro negocio', sector: 'Servicios' });
                });
        } else {
             setTenantInfo({ name: 'nuestro negocio', sector: 'Servicios' });
        }
    } catch (e) {
        console.error("Error decoding token in chat", e);
        setTenantInfo({ name: 'nuestro negocio', sector: 'Servicios' });
    }
  }, [token]);

  // Helper function to play sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime); // Sound frequency
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volume

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // Sound duration
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  };

  // Initialize Socket
  useEffect(() => {
    if (!token) return;

    console.log('[ChatWidget] Initializing socket...');

    const newSocket = io(API_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    newSocket.on('connect', () => {
      console.log('[ChatWidget] Socket connected:', newSocket.id);
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('[ChatWidget] Socket connection error:', err);
    });

    newSocket.on('newMessage', (message: Message) => {
        console.log('[ChatWidget] Received newMessage:', message);
        setMessages((prev) => {
            if (prev.find(m => m.id === message.id)) return prev;
            return [...prev, message];
        });
        
        // Notification Logic
        if (message.senderId !== currentUserId) {
             const isChatOpen = isOpenRef.current;
             const currentTab = activeTabRef.current;
             const isRelevantTab = message.scope === currentTab;

             // If chat is closed OR (open but in different tab), notify
             if (!isChatOpen || !isRelevantTab) {
                 // Play sound
                 playNotificationSound();
                 
                 setUnreadCount(prev => prev + 1);
             } else {
                 // If open and relevant, mark as read immediately?
                 // Ideally we call the API to mark as read, but let's just not increment unread.
                 // The 'useEffect' for history/mark-read will handle it if we switch tabs.
                 // But if we are ALREADY here, we might want to mark it read on the backend too.
                 // For now, simpler is better: just don't increment badge.
             }
        }

        // If message is from a customer and we are admin, maybe auto-select context?
        // Or simply let the admin reply generally.
        // For AI Toggle feature, we need to know WHO sent it.
        if (message.scope === 'CUSTOMER' && message.senderId && role !== 'user') {
             // Optional: Update UI to show who is talking
             setActiveChatUserId(message.senderId);
        }
    });
    
    newSocket.on('aiStatusChanged', (payload: { userId: string, isAiActive: boolean }) => {
        if (activeChatUserId === payload.userId || role === 'user') {
            setActiveCustomerAi(payload.isAiActive);
        }
    });

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  // Toggle AI Function
  const toggleAi = () => {
    const socket = socketRef.current;
    if (!socket || !activeChatUserId) return;
    const newState = !activeCustomerAi;
    socket.emit('toggleAi', { userId: activeChatUserId, isActive: newState });
    setActiveCustomerAi(newState); // Optimistic update
  };


  // Fetch History when opening or changing tabs
  useEffect(() => {
    if (isOpen && token) {
      const scope = activeTab;
      
      // Mark as read when opening this tab
      fetchAPIWithAuth(`/chat/mark-read?scope=${scope}`, { method: 'POST' })
        .then(() => {
            // Update unread count after marking read
            return fetchAPIWithAuth('/chat/unread');
        })
        .then(data => setUnreadCount(data.count || 0))
        .catch(console.error);

      fetchAPIWithAuth(`/chat/history?limit=50&scope=${scope}`)
        .then((data) => {
            const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
            setMessages(sorted);
        })
        .catch(console.error);
    }
  }, [isOpen, token, activeTab]);

  // Show welcome message for users if history is empty
  useEffect(() => {
    if (role === 'user' && isOpen && messages.length === 0 && tenantInfo) {
        // Only show if we are sure history has loaded (simplified check: wait a bit or just show it)
        // For better UX, we could use a loading state. But for now, let's assume if it's empty after load.
        // Actually, we can't distinguish "loading" from "empty" easily without a state.
        // Let's add a "fake" welcome message to the list if it's empty.
        
        const businessName = tenantInfo.name;
        const businessSector = tenantInfo.sector || 'negocio';
        
        const welcomeMsg: Message = {
            id: 'welcome-msg',
            content: t('chat.widget.welcome_msg_template', { businessName, businessSector }),
            senderId: 'ai-bot',
            tenantId: '',
            scope: 'CUSTOMER',
            createdAt: new Date().toISOString(),
            isAi: true
        };
        // Use a timeout to simulate "appearing" after load
        const timer = setTimeout(() => {
            setMessages(prev => {
                if (prev.length === 0) return [welcomeMsg];
                return prev;
            });
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [role, isOpen, messages.length, tenantInfo]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, activeTab]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert(t('chat.widget.mic_error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
      const socket = socketRef.current;
      if (!token || !socket) return;

      setIsUploading(true);
      const formData = new FormData();
      // Create a file from blob
      const file = new File([audioBlob], "voice-note.webm", { type: 'audio/webm' });
      formData.append('file', file);

      try {
          const res = await fetch(`${API_URL}/uploads/chat`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`
              },
              body: formData
          });

          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          const mediaUrl = data.url;

          socket.emit('sendMessage', { 
              content: t('chat.widget.voice_note'),
              scope: activeTab,
              mediaUrl,
              type: 'audio'
          });

      } catch (error) {
          console.error('Error uploading voice note:', error);
          alert(t('chat.widget.upload_error'));
      } finally {
          setIsUploading(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const socket = socketRef.current;
      if (!file || !token || !socket) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          const res = await fetch(`${API_URL}/uploads/chat`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`
              },
              body: formData
          });

          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          const mediaUrl = data.url;

          const type = file.type.startsWith('image/') ? 'image' : 'file';

          socket.emit('sendMessage', { 
              content: type === 'image' ? t('chat.widget.attachment_image') : t('chat.widget.attachment_file'),
              scope: activeTab,
              mediaUrl,
              type
          });

      } catch (error) {
          console.error('Error uploading file:', error);
          alert(t('chat.widget.upload_error'));
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!newMessage.trim() || !socket) return;

    socket.emit('sendMessage', { 
        content: newMessage,
        scope: activeTab,
        // targetUserId: // Only needed if Admin initiates chat with specific customer. 
        // For now, let's assume broad channel or response to last context.
    });
    setNewMessage('');
  };

  if (!token) return null;

  // Filter messages for display (Double check)
  const displayedMessages = messages.filter(m => m.scope === activeTab);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-xl rounded-lg w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-3 flex flex-col text-white">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">
                    {role === 'user' ? t('chat.widget.support_title') : t('chat.widget.messages_center_title')}
                </h3>
                <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 focus:outline-none"
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>
            
            {/* Tabs (Only for Admin/Superadmin) */}
            {role !== 'user' && (
                <div className="flex space-x-2 text-xs">
                    <button 
                        onClick={() => setActiveTab('INTERNAL')}
                        className={`px-2 py-1 rounded ${activeTab === 'INTERNAL' ? 'bg-white text-indigo-600 font-bold' : 'bg-indigo-700 text-indigo-200'}`}
                    >
                        {t('chat.widget.tab_team')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('CUSTOMER')}
                        className={`px-2 py-1 rounded ${activeTab === 'CUSTOMER' ? 'bg-white text-indigo-600 font-bold' : 'bg-indigo-700 text-indigo-200'}`}
                    >
                        {t('chat.widget.tab_clients')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('SUPPORT')}
                        className={`px-2 py-1 rounded ${activeTab === 'SUPPORT' ? 'bg-white text-indigo-600 font-bold' : 'bg-indigo-700 text-indigo-200'}`}
                    >
                        {t('chat.widget.tab_support')}
                    </button>
                </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 relative">
            {/* AI Status Banner for Admin */}
            {role !== 'user' && activeChatUserId && activeTab === 'CUSTOMER' && (
                <div className="sticky top-0 z-10 flex justify-center mb-2">
                    <button 
                        onClick={toggleAi}
                        className={`text-[10px] px-2 py-1 rounded-full shadow border flex items-center gap-1 ${
                            activeCustomerAi 
                            ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200' 
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                    >
                        {activeCustomerAi ? t('chat.widget.ai_active') : t('chat.widget.ai_paused')}
                    </button>
                </div>
            )}

            {displayedMessages.length === 0 && (
                <p className="text-center text-gray-400 text-xs mt-4">{t('chat.widget.no_messages')}</p>
            )}
            {displayedMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const isAi = msg.isAi;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-2 text-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : isAi
                        ? 'bg-purple-100 border border-purple-200 text-purple-900 rounded-bl-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {!isMe && (
                      <div className={`text-xs mb-1 font-bold flex justify-between gap-2 ${isAi ? 'text-purple-700' : 'text-gray-500'}`}>
                        <span>{isAi ? '🤖 Asistente Virtual' : (msg.sender?.firstName || 'Usuario')}</span>
                        {/* Show Role if needed, or context */}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    {msg.type === 'image' && msg.mediaUrl && (
                        <img src={msg.mediaUrl} alt="attachment" className="mt-2 rounded-md max-w-full h-auto" />
                    )}
                    {msg.type === 'audio' && msg.mediaUrl && (
                        <audio controls src={msg.mediaUrl} className="mt-2 w-full max-w-[200px]" />
                    )}
                    {msg.type === 'file' && msg.mediaUrl && (
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-indigo-500 underline text-xs">
                            {t('chat.widget.download_file')}
                        </a>
                    )}
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'} text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center">
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
                className="text-gray-500 hover:text-indigo-600 focus:outline-none disabled:opacity-50"
                title={t('chat.widget.attach_file')}
            >
                {isUploading ? (
                     <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                )}
            </button>
            
            <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isUploading}
                className={`text-gray-500 hover:text-indigo-600 focus:outline-none transition-colors ${isRecording ? 'text-red-600 animate-pulse' : ''}`}
                title="Hold to record"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill={isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
            </button>

            {isRecording ? (
                 <div className="flex-1 border border-red-300 rounded-md px-3 py-2 text-sm bg-red-50 text-red-600 flex items-center justify-between animate-pulse">
                    <span>Recording...</span>
                 </div>
            ) : (
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('chat.widget.input_placeholder')}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            )}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-105 focus:outline-none relative"
      >
        {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
        )}
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
      </button>
    </div>
  );
}
