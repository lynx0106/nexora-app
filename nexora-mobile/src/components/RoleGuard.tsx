import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

type UserRole = 'user' | 'staff' | 'admin' | 'superadmin';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackMessage?: string;
}

// Jerarquía de roles
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  staff: 2,
  admin: 3,
  superadmin: 4,
};

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackMessage = 'No tienes permiso para acceder a esta sección' 
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();

  // Si está cargando, mostrar nada
  if (isLoading) {
    return null;
  }

  // Si no hay usuario, no mostrar nada (debería estar en auth)
  if (!user) {
    return null;
  }

  const userRole = user.role as UserRole;
  const userLevel = ROLE_HIERARCHY[userRole] || 0;

  // Verificar si el rol del usuario está permitido
  // Un usuario con rol superior puede acceder a funciones de roles inferiores
  const hasAccess = allowedRoles.some(allowedRole => {
    const requiredLevel = ROLE_HIERARCHY[allowedRole];
    return userLevel >= requiredLevel;
  });

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>_LOCK</Text>
        <Text style={styles.title}>Acceso Restringido</Text>
        <Text style={styles.message}>{fallbackMessage}</Text>
        <Text style={styles.hint}>Tu rol actual: {userRole}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Hook para verificar permisos
export function useHasRole(requiredRoles: UserRole[]): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userRole = user.role as UserRole;
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  
  return requiredRoles.some(requiredRole => {
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    return userLevel >= requiredLevel;
  });
}

// Hook para obtener el nivel del rol actual
export function useRoleLevel(): number {
  const { user } = useAuth();
  
  if (!user) return 0;
  
  const userRole = user.role as UserRole;
  return ROLE_HIERARCHY[userRole] || 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});