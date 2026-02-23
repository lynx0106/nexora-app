import apiClient from './client';

export interface InvitationValidationResponse {
  valid: boolean;
  invitationId: string;
  tenantId: string;
  tenantName: string;
  role: string;
  expiresAt: string;
}

export interface GenerateInvitationRequest {
  role?: 'client' | 'employee' | 'staff';
  tenantId?: string;
}

export interface GenerateInvitationResponse {
  id: string;
  qrData: string;
  deepLink: string;
  webUrl: string;
  expiresAt: string;
}

class InvitationsApi {
  /**
   * Valida un código de invitación
   */
  async validate(invitationId: string): Promise<InvitationValidationResponse> {
    return apiClient.get<InvitationValidationResponse>(`/invitations/${invitationId}/validate`);
  }

  /**
   * Genera un código de invitación (solo admin)
   */
  async generate(data: GenerateInvitationRequest): Promise<GenerateInvitationResponse> {
    return apiClient.post<GenerateInvitationResponse>('/invitations/generate', data);
  }

  /**
   * Parsea los datos de un QR de invitación
   */
  parseQRData(qrData: string): {
    type: string;
    version: number;
    invitationId: string;
    tenantId: string;
    role: string;
    tenantName: string;
  } | null {
    try {
      const data = JSON.parse(qrData);
      if (data.type === 'nexora-invite') {
        return {
          type: data.type,
          version: data.version,
          invitationId: data.invitationId,
          tenantId: data.tenantId,
          role: data.role,
          tenantName: data.tenantName,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parsea un deep link de invitación
   */
  parseDeepLink(url: string): {
    invitationId: string;
    tenantId: string;
    role: string;
    tenantName: string;
  } | null {
    try {
      // nexora://invite?id=xxx&tenant=xxx&role=xxx&name=xxx
      const urlObj = new URL(url);
      if (urlObj.protocol === 'nexora:' && urlObj.host === 'invite') {
        const params = urlObj.searchParams;
        return {
          invitationId: params.get('id') || '',
          tenantId: params.get('tenant') || '',
          role: params.get('role') || 'client',
          tenantName: decodeURIComponent(params.get('name') || ''),
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const invitationsApi = new InvitationsApi();
export default invitationsApi;
