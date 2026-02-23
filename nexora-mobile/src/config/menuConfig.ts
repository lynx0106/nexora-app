/**
 * Configuración de menú y cards según el tipo de negocio
 * 
 * Este archivo define qué funcionalidades están disponibles para cada tipo de negocio
 * y cómo se deben mostrar las cards en el HomeScreen y el Drawer.
 */

export type BusinessType = 'restaurant' | 'hotel' | 'clinic' | 'retail' | 'services' | 'gym' | 'salon' | 'other';

export interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  route: string;
}

export interface BusinessFeatures {
  hasOrders: boolean;
  hasAppointments: boolean;
  appointmentLabel: string;
  productLabel: string;
  orderLabel: string;
}

/**
 * Configuración de features por tipo de negocio
 */
export const BUSINESS_FEATURES: Record<BusinessType, BusinessFeatures> = {
  restaurant: {
    hasOrders: true,
    hasAppointments: true,
    appointmentLabel: 'Reservas',
    productLabel: 'Menú',
    orderLabel: 'Pedidos',
  },
  hotel: {
    hasOrders: false,
    hasAppointments: true,
    appointmentLabel: 'Reservas',
    productLabel: 'Servicios',
    orderLabel: '',
  },
  clinic: {
    hasOrders: false,
    hasAppointments: true,
    appointmentLabel: 'Citas',
    productLabel: 'Servicios',
    orderLabel: '',
  },
  salon: {
    hasOrders: false,
    hasAppointments: true,
    appointmentLabel: 'Citas',
    productLabel: 'Servicios',
    orderLabel: '',
  },
  gym: {
    hasOrders: false,
    hasAppointments: true,
    appointmentLabel: 'Citas',
    productLabel: 'Planes',
    orderLabel: '',
  },
  retail: {
    hasOrders: true,
    hasAppointments: false,
    appointmentLabel: '',
    productLabel: 'Productos',
    orderLabel: 'Pedidos',
  },
  services: {
    hasOrders: false,
    hasAppointments: true,
    appointmentLabel: 'Citas',
    productLabel: 'Servicios',
    orderLabel: '',
  },
  other: {
    hasOrders: false,
    hasAppointments: false,
    appointmentLabel: '',
    productLabel: 'Productos',
    orderLabel: '',
  },
};

/**
 * Obtiene las features de un tipo de negocio
 */
export function getBusinessFeatures(businessType: BusinessType | null): BusinessFeatures {
  return BUSINESS_FEATURES[businessType || 'other'];
}

/**
 * Obtiene los items del menú según el rol y tipo de negocio
 * Las rutas coinciden con los nombres del Drawer Navigator
 */
export function getMenuItems(role: string, businessType: BusinessType | null): MenuItem[] {
  const features = getBusinessFeatures(businessType);
  const menuItems: MenuItem[] = [];

  // Productos/Servicios - siempre visible
  menuItems.push({
    icon: businessType === 'restaurant' ? '🍽️' : '📦',
    title: features.productLabel,
    subtitle: 'Ver catálogo',
    route: 'Productos', // Nombre del drawer
  });

  // Pedidos - solo si el negocio tiene pedidos
  if (features.hasOrders) {
    menuItems.push({
      icon: '🛒',
      title: features.orderLabel,
      subtitle: role === 'user' ? 'Mis pedidos' : 'Gestionar pedidos',
      route: 'Pedidos', // Nombre del drawer
    });
  }

  // Citas/Reservas - solo si el negocio tiene citas
  if (features.hasAppointments) {
    menuItems.push({
      icon: '📅',
      title: features.appointmentLabel,
      subtitle: role === 'user' ? `Mis ${features.appointmentLabel.toLowerCase()}` : 'Agenda',
      route: 'Citas', // Nombre del drawer
    });
  }

  // Chat - siempre visible (navega a pantalla del RootStack)
  menuItems.push({
    icon: '💬',
    title: 'Soporte',
    subtitle: 'Chat con nosotros',
    route: 'ChatList',
  });

  // Dashboard - solo para admin/superadmin
  if (role === 'admin' || role === 'superadmin') {
    menuItems.push({
      icon: '📊',
      title: 'Dashboard',
      subtitle: 'Métricas',
      route: 'Dashboard', // Nombre del drawer
    });
  }

  return menuItems;
}

/**
 * Obtiene el label de citas/reservas según el tipo de negocio
 */
export function getAppointmentLabel(businessType: BusinessType | null): string {
  return getBusinessFeatures(businessType).appointmentLabel || 'Citas';
}

/**
 * Verifica si un tipo de negocio tiene pedidos
 */
export function hasOrders(businessType: BusinessType | null): boolean {
  return getBusinessFeatures(businessType).hasOrders;
}

/**
 * Verifica si un tipo de negocio tiene citas/reservas
 */
export function hasAppointments(businessType: BusinessType | null): boolean {
  return getBusinessFeatures(businessType).hasAppointments;
}

/**
 * Convierte un string a BusinessType de forma segura
 */
export function toBusinessType(type: string | null | undefined): BusinessType {
  if (!type) return 'other';
  const validTypes: BusinessType[] = ['restaurant', 'hotel', 'clinic', 'retail', 'services', 'gym', 'salon', 'other'];
  return validTypes.includes(type as BusinessType) ? (type as BusinessType) : 'other';
}
