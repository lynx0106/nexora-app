import React, { useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Linking } from 'react-native';
import { NavigationContainer, DrawerActions, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getBusinessFeatures, toBusinessType, hasOrders, hasAppointments, BusinessType } from '../config/menuConfig';
import { colors } from '../theme';
import { WEB_URL } from '../config/api.config';

// Importar pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import InviteRegisterScreen from '../screens/auth/InviteRegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import FavoritesScreen from '../screens/products/FavoritesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import CartScreen from '../screens/orders/CartScreen';
import CheckoutScreen from '../screens/orders/CheckoutScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import BookAppointmentScreen from '../screens/appointments/BookAppointmentScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  InviteRegister: {
    invitationId?: string;
    tenantId?: string;
    tenantName?: string;
    role?: string;
  };
};

export type MainDrawerParamList = {
  Inicio: undefined;
  Productos: undefined;
  Pedidos: undefined;
  Citas: undefined;
  Dashboard: undefined;
  Perfil: undefined;
  CerrarSesion: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProductDetail: { productId: string };
  OrderDetail: { orderId: string };
  Favorites: undefined;
  Cart: undefined;
  Checkout: undefined;
  ChatList: undefined;
  ChatRoom: { targetUserId: string; targetUserName?: string; isInternalChat?: boolean };
  Appointments: undefined;
  BookAppointment: { serviceId?: string };
  Dashboard: undefined;
  Home: undefined;
  Products: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainDrawer = createDrawerNavigator<MainDrawerParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen 
        name="InviteRegister" 
        component={InviteRegisterScreen}
        options={{ headerShown: true, title: 'Completar Registro' }}
      />
    </AuthStack.Navigator>
  );
}

// Componente personalizado para el Drawer
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  
  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      {/* Header del Drawer */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={70} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{user?.email || 'usuario@nexora.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Usuario'}</Text>
        </View>
      </View>
      
      {/* Items del Drawer */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>
      
      {/* Footer con Cerrar Sesión y enlaces legales */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}>
            <Text style={styles.legalLinkText}>Privacidad</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/terms`)}>
            <Text style={styles.legalLinkText}>Términos</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>Nexora v1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

function MainNavigator() {
  const { user, businessType, logout } = useAuth();
  
  // Convertir businessType al tipo correcto y obtener features
  const typedBusinessType: BusinessType = useMemo(() => toBusinessType(businessType), [businessType]);
  const features = useMemo(() => getBusinessFeatures(typedBusinessType), [typedBusinessType]);
  
  // Determinar las opciones del drawer según el rol y tipo de negocio
  const getDrawerScreens = useMemo(() => {
    const role = user?.role;
    const screens: Array<{
      name: string;
      title: string;
      icon: keyof typeof Ionicons.glyphMap;
      iconOutline: keyof typeof Ionicons.glyphMap;
      component: React.ComponentType<any>;
    }> = [
      { 
        name: 'Inicio', 
        title: 'Inicio', 
        icon: 'home', 
        iconOutline: 'home-outline',
        component: HomeScreen 
      },
      { 
        name: 'Productos', 
        title: features.productLabel, 
        icon: typedBusinessType === 'restaurant' ? 'restaurant' : 'cube', 
        iconOutline: typedBusinessType === 'restaurant' ? 'restaurant-outline' : 'cube-outline',
        component: ProductsScreen 
      },
    ];
    
    // Agregar Pedidos solo si el negocio tiene pedidos
    if (features.hasOrders) {
      screens.push({ 
        name: 'Pedidos', 
        title: features.orderLabel, 
        icon: 'cart', 
        iconOutline: 'cart-outline',
        component: OrdersScreen 
      });
    }
    
    // Agregar Citas/Reservas solo si el negocio tiene citas (no para superadmin)
    if (features.hasAppointments && role !== 'superadmin') {
      screens.push({ 
        name: 'Citas', 
        title: features.appointmentLabel, 
        icon: 'calendar', 
        iconOutline: 'calendar-outline',
        component: AppointmentsScreen 
      });
    }
    
    // Agregar Dashboard para admin
    if (role === 'admin' || role === 'superadmin') {
      screens.push({ 
        name: 'Dashboard', 
        title: 'Panel Admin', 
        icon: 'stats-chart', 
        iconOutline: 'stats-chart-outline',
        component: DashboardScreen 
      });
    }
    
    screens.push({ 
      name: 'Perfil', 
      title: 'Mi Perfil', 
      icon: 'person', 
      iconOutline: 'person-outline',
      component: ProfileScreen 
    });
    
    return screens;
  }, [user?.role, typedBusinessType, features]);

  return (
    <MainDrawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => {
        const screen = getDrawerScreens.find(s => s.name === route.name);
        return {
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textMuted,
          drawerLabel: screen?.title || route.name,
          drawerIcon: ({ focused, color, size }) => {
            const iconName = focused ? screen?.icon : screen?.iconOutline;
            return iconName ? <Ionicons name={iconName} size={size} color={color} /> : null;
          },
        };
      }}
    >
      {getDrawerScreens.map((screen) => (
        <MainDrawer.Screen 
          key={screen.name}
          name={screen.name as keyof MainDrawerParamList} 
          component={screen.component}
          options={{ 
            title: screen.title,
            drawerLabel: screen.title,
          }}
        />
      ))}
    </MainDrawer.Navigator>
  );
}

export const AppNavigator = forwardRef<NavigationContainerRef<any>>((props, ref) => {
  const { isAuthenticated, isLoading, businessType } = useAuth();
  const isRestaurant = businessType === 'restaurant';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={ref}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen 
              name="ProductDetail" 
              component={ProductDetailScreen}
              options={{ headerShown: true, title: 'Detalle' }}
            />
            <RootStack.Screen 
              name="Favorites" 
              component={FavoritesScreen}
              options={{ headerShown: true, title: 'Favoritos' }}
            />
            <RootStack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{ headerShown: true, title: 'Carrito' }}
            />
            <RootStack.Screen 
              name="Checkout" 
              component={CheckoutScreen}
              options={{ headerShown: true, title: 'Checkout' }}
            />
            <RootStack.Screen 
              name="OrderDetail" 
              component={OrderDetailScreen}
              options={{ headerShown: true, title: 'Pedido' }}
            />
            <RootStack.Screen 
              name="ChatList" 
              component={ChatListScreen}
              options={{ headerShown: true, title: 'Chat' }}
            />
            <RootStack.Screen 
              name="ChatRoom" 
              component={ChatRoomScreen}
              options={{ headerShown: true, title: 'Conversación' }}
            />
            <RootStack.Screen 
              name="Appointments" 
              component={AppointmentsScreen}
              options={{ headerShown: true, title: isRestaurant ? 'Reservas' : 'Citas' }}
            />
            <RootStack.Screen 
              name="BookAppointment" 
              component={BookAppointmentScreen}
              options={{ headerShown: true, title: isRestaurant ? 'Hacer Reserva' : 'Agendar Cita' }}
            />
            <RootStack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ headerShown: true, title: 'Dashboard' }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
});

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: colors.primary,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  drawerItems: {
    flex: 1,
    paddingTop: 8,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 16,
    color: colors.error,
    marginLeft: 12,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  legalLinkText: {
    fontSize: 13,
    color: colors.primary,
  },
  legalSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AppNavigator;
