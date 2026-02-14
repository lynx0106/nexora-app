'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import { fetchAPIWithAuth, API_URL } from '@/lib/api';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // 1. Fetch initial unread notifications
    const loadNotifications = async () => {
      try {
        const data = await fetchAPIWithAuth('/notifications/unread');
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.length);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();

    // 2. Connect to Socket
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use a separate namespace or the same one? Ideally separate '/notifications'
    // But our backend setup is on the same port, just namespace needs to be handled on client
    // NestJS Gateway namespace: 'notifications'
    const newSocket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Notifications Socket');
    });

    newSocket.on('notification', (notification: Notification) => {
      // Play sound or show toast (optional)
      // const audio = new Audio('/notification-sound.mp3'); // Ensure this file exists or remove
      // audio.play().catch(() => {}); // Ignore auto-play errors

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchAPIWithAuth(`/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchAPIWithAuth('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-80 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {t('notifications.mark_all_read')}
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {t('notifications.no_notifications')}
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-2 w-2 h-2 bg-blue-600 rounded-full"
                          title={t('notifications.mark_read')}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
