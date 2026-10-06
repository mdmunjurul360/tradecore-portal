import api from '@/lib/api';

export interface KycStatusResponse {
  kycStatus: string;
  nationalId: string | null;
  latestDocument: {
    id: string;
    status: string;
    documentType: string;
    rejectionReason: string | null;
    createdAt: string;
  } | null;
}

export interface SubmitKycPayload {
  nationalId: string;
  dateOfBirth: string;
  country: string;
  address: string;
  documentType: string;
  documentReference: string;
}

export interface UploadResponse {
  fileId: string;
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
}

export const kycService = {
  getStatus: async (): Promise<KycStatusResponse> => {
    const { data } = await api.get('/kyc/status');
    return data.data; // assuming interceptor wraps in .data
  },

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await api.post('/upload/kyc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  submitKyc: async (payload: SubmitKycPayload) => {
    const { data } = await api.post('/kyc/submit', payload);
    return data.data;
  },
};
