import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import invitationsApi, { InvitationValidationResponse } from '../../api/invitations.api';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { AuthStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'InviteRegister'>;

// Interfaz para el resultado de validación de contraseña
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

// Función de validación de contraseña robusta
const validatePassword = (password: string): PasswordValidationResult => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const errors: string[] = [];
  
  if (!requirements.minLength) {
    errors.push('Al menos 8 caracteres');
  }
  if (!requirements.hasUppercase) {
    errors.push('Al menos una letra mayúscula');
  }
  if (!requirements.hasLowercase) {
    errors.push('Al menos una letra minúscula');
  }
  if (!requirements.hasNumber) {
    errors.push('Al menos un número');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Al menos un carácter especial (!@#$%^&*...)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
};

export default function InviteRegisterScreen({ navigation, route }: Props) {
  const { invitationId, tenantId, tenantName, role } = route.params || {};
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationValidationResponse | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  const { register } = useAuth();

  // Validar invitación al cargar
  useEffect(() => {
    validateInvitation();
  }, [invitationId]);

  const validateInvitation = async () => {
    if (!invitationId) {
      setIsValidating(false);
      return;
    }

    try {
      const result = await invitationsApi.validate(invitationId);
      setInvitationData(result);
      
      if (!result.valid) {
        Alert.alert(
          'Invitación Inválida',
          'Esta invitación ha expirado o ya fue utilizada.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo validar la invitación',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } finally {
      setIsValidating(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (firstName.length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (lastName.length < 2) {
      Alert.alert('Error', 'El apellido debe tener al menos 2 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    // Validación robusta de contraseña
    const validation = validatePassword(password);
    if (!validation.isValid) {
      Alert.alert(
        'Contraseña Insegura',
        `La contraseña no cumple con los siguientes requisitos:\n\n${validation.errors.join('\n')}`
      );
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone,
        invitationId: invitationId || invitationData?.invitationId,
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Validando invitación...</Text>
      </View>
    );
  }

  const displayTenantName = tenantName || invitationData?.tenantName || 'Negocio';
  const displayRole = role || invitationData?.role || 'client';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>Nexora</Text>
          <Text style={styles.subtitle}>Únete a {displayTenantName}</Text>
          <View style={styles.invitationBadge}>
            <Text style={styles.invitationBadgeText}>
              Serás registrado como: {displayRole === 'client' ? 'Cliente' : displayRole === 'employee' ? 'Empleado' : 'Staff'}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                placeholder="Pérez"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+57 300 123 4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordValidation(validatePassword(text));
                setShowPasswordRequirements(text.length > 0);
              }}
              onFocus={() => setShowPasswordRequirements(password.length > 0)}
              secureTextEntry
            />
            {/* Indicadores visuales de requisitos de contraseña */}
            {showPasswordRequirements && passwordValidation && (
              <View style={styles.passwordRequirementsContainer}>
                <Text style={styles.passwordRequirementsTitle}>Requisitos de contraseña:</Text>
                <View style={styles.requirementRow}>
                  <Text style={[
                    styles.requirementText,
                    passwordValidation.requirements.minLength ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {passwordValidation.requirements.minLength ? '✓' : '○'} Mínimo 8 caracteres
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[
                    styles.requirementText,
                    passwordValidation.requirements.hasUppercase ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {passwordValidation.requirements.hasUppercase ? '✓' : '○'} Una letra mayúscula
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[
                    styles.requirementText,
                    passwordValidation.requirements.hasLowercase ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {passwordValidation.requirements.hasLowercase ? '✓' : '○'} Una letra minúscula
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[
                    styles.requirementText,
                    passwordValidation.requirements.hasNumber ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {passwordValidation.requirements.hasNumber ? '✓' : '○'} Un número
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text style={[
                    styles.requirementText,
                    passwordValidation.requirements.hasSpecialChar ? styles.requirementMet : styles.requirementNotMet
                  ]}>
                    {passwordValidation.requirements.hasSpecialChar ? '✓' : '○'} Un carácter especial (!@#$%^&*...)
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  invitationBadge: {
    backgroundColor: colors.primaryLight || '#e0e7ff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  invitationBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  form: {
    ...shadows.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: colors.textLight,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  passwordRequirementsContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background || '#f5f5f5',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder || '#e0e0e0',
  },
  passwordRequirementsTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  requirementText: {
    ...typography.caption,
    fontSize: 12,
  },
  requirementMet: {
    color: colors.success || '#22c55e',
    fontWeight: '500',
  },
  requirementNotMet: {
    color: colors.textSecondary || '#6b7280',
  },
});
