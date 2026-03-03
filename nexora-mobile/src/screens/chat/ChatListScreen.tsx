import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Conversation } from '../../api/chat.api';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatList'>;

export default function ChatListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { conversations, teamUsers, isLoading, loadConversations, loadTeamUsers, unreadCount } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);

  // Check if user is admin/staff (can see team members)
  const isStaff = user?.role === 'admin' || user?.role === 'employee' || user?.role === 'superadmin';

  useEffect(() => {
    loadConversations();
    // Load team users for staff/admin
    if (isStaff) {
      loadTeamUsers();
    }
  }, []);

  // Agregar botón de nueva conversación en el header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNewConversation}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    if (isStaff) {
      await loadTeamUsers();
    }
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Use targetUserName if available (for internal chat), otherwise use name
    const userName = conversation.targetUserName || conversation.name;
    // Check if this is an internal team chat
    const isInternal = conversation.scope === 'INTERNAL' || !!conversation.targetUserId;
    navigation.navigate('ChatRoom', { 
      targetUserId: conversation.targetUserId || conversation.id,
      targetUserName: userName,
      isInternalChat: isInternal,
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return date.toLocaleDateString('es', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name || 'Usuario'}</Text>
          <Text style={styles.conversationTime}>
            {formatTime((item as any).lastMessageAt)}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Sin mensajes'}
          </Text>
          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleNewConversation = () => {
    // For regular users, start chat with support
    // For admins/staff, show a list of users to chat with
    if (user?.role === 'user' || user?.role === 'customer') {
      // Navigate to chat with default support
      navigation.navigate('ChatRoom', { 
        targetUserId: 'support',
        targetUserName: 'Soporte',
      });
    } else {
      // For staff/admin, show a message or navigate to user selection
      Alert.alert(
        'Nueva Conversación',
        'Aquí podrás seleccionar un usuario para iniciar una conversación.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>Sin conversaciones</Text>
      <Text style={styles.emptyText}>
        {showInternalChat 
          ? 'No hay miembros del equipo disponibles'
          : user?.role === 'user' || user?.role === 'customer'
            ? 'Inicia una conversación con el equipo de soporte'
            : 'Las conversaciones con clientes aparecerán aquí'
        }
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handleNewConversation}
      >
        <Text style={styles.emptyButtonText}>
          {showInternalChat ? 'Actualizar' : 'Iniciar Conversación'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !refreshing && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }

  // Siempre mostrar el botón de nueva conversación (FAB style en la lista)
  const renderListFooter = () => (
    <TouchableOpacity
      style={styles.fab}
      onPress={handleNewConversation}
      activeOpacity={0.8}
    >
      <Text style={styles.fabIcon}>+</Text>
    </TouchableOpacity>
  );

  // Determine which data to show based on toggle
  const displayData = showInternalChat ? teamUsers : conversations;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && !showInternalChat && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} mensaje{unreadCount !== 1 ? 's' : ''} sin leer
          </Text>
        </View>
      )}
      {/* Toggle between customer conversations and team members for staff */}
      {isStaff && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, !showInternalChat && styles.tabActive]}
            onPress={() => setShowInternalChat(false)}
          >
            <Text style={[styles.tabText, !showInternalChat && styles.tabTextActive]}>
              Clientes ({conversations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showInternalChat && styles.tabActive]}
            onPress={() => setShowInternalChat(true)}
          >
            <Text style={[styles.tabText, showInternalChat && styles.tabTextActive]}>
              Equipo ({teamUsers.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={[
          styles.list,
          displayData.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    marginRight: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  unreadBanner: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unreadBannerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});