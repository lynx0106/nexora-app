import { HttpException, HttpStatus } from '@nestjs/common';

export enum BusinessErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  TOKEN_INVALID = 'AUTH_003',
  UNAUTHORIZED = 'AUTH_004',
  FORBIDDEN = 'AUTH_005',

  // User errors
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_INACTIVE = 'USER_003',

  // Tenant errors
  TENANT_NOT_FOUND = 'TENANT_001',
  TENANT_ALREADY_EXISTS = 'TENANT_002',
  TENANT_INACTIVE = 'TENANT_003',

  // Product errors
  PRODUCT_NOT_FOUND = 'PRODUCT_001',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_002',
  PRODUCT_ALREADY_EXISTS = 'PRODUCT_003',

  // Order errors
  ORDER_NOT_FOUND = 'ORDER_001',
  ORDER_INVALID_STATUS = 'ORDER_002',
  ORDER_PAYMENT_FAILED = 'ORDER_003',

  // Appointment errors
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_001',
  APPOINTMENT_SLOT_UNAVAILABLE = 'APPOINTMENT_002',
  APPOINTMENT_INVALID_DATE = 'APPOINTMENT_003',

  // Payment errors
  PAYMENT_NOT_FOUND = 'PAYMENT_001',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_002',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_003',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_001',
  INVALID_INPUT = 'VALIDATION_002',
  MISSING_REQUIRED_FIELD = 'VALIDATION_003',

  // General errors
  RESOURCE_NOT_FOUND = 'GENERAL_001',
  OPERATION_NOT_ALLOWED = 'GENERAL_002',
  INTERNAL_ERROR = 'GENERAL_999',
}

interface BusinessErrorResponse {
  code: BusinessErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
}

export class BusinessException extends HttpException {
  constructor(
    public readonly code: BusinessErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      } as BusinessErrorResponse,
      status,
    );
  }

  getResponse(): BusinessErrorResponse {
    const response = super.getResponse() as BusinessErrorResponse;
    return response;
  }
}

// Factory functions para errores comunes
export const Errors = {
  // Auth
  invalidCredentials: () =>
    new BusinessException(
      BusinessErrorCode.INVALID_CREDENTIALS,
      'Credenciales inválidas',
      HttpStatus.UNAUTHORIZED,
    ),

  unauthorized: (message = 'No autorizado') =>
    new BusinessException(BusinessErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED),

  forbidden: (message = 'Acceso denegado') =>
    new BusinessException(BusinessErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN),

  // Users
  userNotFound: (id?: string) =>
    new BusinessException(
      BusinessErrorCode.USER_NOT_FOUND,
      id ? `Usuario con ID ${id} no encontrado` : 'Usuario no encontrado',
      HttpStatus.NOT_FOUND,
      id ? { userId: id } : undefined,
    ),

  userAlreadyExists: (email: string) =>
    new BusinessException(
      BusinessErrorCode.USER_ALREADY_EXISTS,
      `El usuario con email ${email} ya existe`,
      HttpStatus.CONFLICT,
      { email },
    ),

  // Tenants
  tenantNotFound: (id?: string) =>
    new BusinessException(
      BusinessErrorCode.TENANT_NOT_FOUND,
      id ? `Tenant con ID ${id} no encontrado` : 'Tenant no encontrado',
      HttpStatus.NOT_FOUND,
      id ? { tenantId: id } : undefined,
    ),

  tenantAlreadyExists: (id: string) =>
    new BusinessException(
      BusinessErrorCode.TENANT_ALREADY_EXISTS,
      `El tenant con ID ${id} ya existe`,
      HttpStatus.CONFLICT,
      { tenantId: id },
    ),

  // Products
  productNotFound: (id?: string) =>
    new BusinessException(
      BusinessErrorCode.PRODUCT_NOT_FOUND,
      id ? `Producto con ID ${id} no encontrado` : 'Producto no encontrado',
      HttpStatus.NOT_FOUND,
      id ? { productId: id } : undefined,
    ),

  productOutOfStock: (productName: string, requested: number, available: number) =>
    new BusinessException(
      BusinessErrorCode.PRODUCT_OUT_OF_STOCK,
      `Stock insuficiente para ${productName}`,
      HttpStatus.BAD_REQUEST,
      { productName, requested, available },
    ),

  // Orders
  orderNotFound: (id?: string) =>
    new BusinessException(
      BusinessErrorCode.ORDER_NOT_FOUND,
      id ? `Pedido con ID ${id} no encontrado` : 'Pedido no encontrado',
      HttpStatus.NOT_FOUND,
      id ? { orderId: id } : undefined,
    ),

  invalidOrderStatus: (current: string, expected: string) =>
    new BusinessException(
      BusinessErrorCode.ORDER_INVALID_STATUS,
      `Estado de pedido inválido. Actual: ${current}, Esperado: ${expected}`,
      HttpStatus.BAD_REQUEST,
      { currentStatus: current, expectedStatus: expected },
    ),

  // Appointments
  appointmentNotFound: (id?: string) =>
    new BusinessException(
      BusinessErrorCode.APPOINTMENT_NOT_FOUND,
      id ? `Cita con ID ${id} no encontrada` : 'Cita no encontrada',
      HttpStatus.NOT_FOUND,
      id ? { appointmentId: id } : undefined,
    ),

  appointmentSlotUnavailable: (date: string, time: string) =>
    new BusinessException(
      BusinessErrorCode.APPOINTMENT_SLOT_UNAVAILABLE,
      `El horario ${time} del ${date} no está disponible`,
      HttpStatus.CONFLICT,
      { date, time },
    ),

  // Validation
  validationError: (errors: Record<string, string>) =>
    new BusinessException(
      BusinessErrorCode.VALIDATION_ERROR,
      'Error de validación',
      HttpStatus.BAD_REQUEST,
      { errors },
    ),

  invalidInput: (field: string, reason: string) =>
    new BusinessException(
      BusinessErrorCode.INVALID_INPUT,
      `Campo inválido: ${field}`,
      HttpStatus.BAD_REQUEST,
      { field, reason },
    ),

  // General
  resourceNotFound: (resource: string, id?: string) =>
    new BusinessException(
      BusinessErrorCode.RESOURCE_NOT_FOUND,
      id ? `${resource} con ID ${id} no encontrado` : `${resource} no encontrado`,
      HttpStatus.NOT_FOUND,
      id ? { resource, id } : { resource },
    ),

  operationNotAllowed: (operation: string, reason: string) =>
    new BusinessException(
      BusinessErrorCode.OPERATION_NOT_ALLOWED,
      `Operación no permitida: ${operation}`,
      HttpStatus.FORBIDDEN,
      { operation, reason },
    ),

  internalError: (message = 'Error interno del servidor') =>
    new BusinessException(
      BusinessErrorCode.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    ),
};
