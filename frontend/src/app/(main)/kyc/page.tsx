'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycService } from '@/services/kyc.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function KycPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nationalId: '',
    dateOfBirth: '',
    country: '',
    address: '',
    documentType: 'PASSPORT',
  });

  const { data: kycStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycService.getStatus,
  });

  const uploadMutation = useMutation({
    mutationFn: kycService.uploadDocument,
  });

  const submitMutation = useMutation({
    mutationFn: kycService.submitKyc,
    onSuccess: () => {
      toast.success('KYC Application Submitted');
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit KYC');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a document to upload');
      return;
    }

    try {
      const uploadRes = await uploadMutation.mutateAsync(file);
      await submitMutation.mutateAsync({
        ...formData,
        documentReference: uploadRes.fileId,
      });
    } catch (err) {
      // Error handled by mutations
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = kycStatus?.kycStatus === 'PENDING';
  const isApproved = kycStatus?.kycStatus === 'APPROVED';
  const isRejected = kycStatus?.kycStatus === 'REJECTED';
  const notSubmitted = kycStatus?.kycStatus === 'NOT_SUBMITTED';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Identity Verification (KYC)</h3>
        <p className="text-muted-foreground">
          Complete your identity verification to unlock all account features and higher limits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Your current KYC standing</CardDescription>
            </div>
            {isApproved && <Badge className="bg-green-500"><CheckCircle2 className="w-4 h-4 mr-1" /> Approved</Badge>}
            {isPending && <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" /> Pending Review</Badge>}
            {isRejected && <Badge variant="destructive"><AlertCircle className="w-4 h-4 mr-1" /> Rejected</Badge>}
            {notSubmitted && <Badge variant="outline">Not Submitted</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isApproved && (
            <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-lg">
              Your identity has been successfully verified. You now have full access to all trading features and increased limits.
            </div>
          )}
          
          {isPending && (
            <div className="bg-secondary/50 text-secondary-foreground p-4 rounded-lg">
              Your application is currently under review by our compliance team. This usually takes 1-2 business days. We will notify you once the review is complete.
            </div>
          )}

          {isRejected && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
              <p className="font-semibold mb-1">Your application was rejected.</p>
              <p className="text-sm">Reason: {kycStatus?.latestDocument?.rejectionReason || 'Document unclear or invalid.'}</p>
              <p className="text-sm mt-2">Please resubmit your application below with valid documents.</p>
            </div>
          )}

          {(notSubmitted || isRejected) && (
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID / Passport Number</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country of Residence</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(val) => setFormData({ ...formData, documentType: val || '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="ID_CARD">National ID Card</SelectItem>
                      <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Residential Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Document Upload</Label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById('fileUpload')?.click()}>
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Click to select document</p>
                  <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, PDF (Max 5MB)</p>
                  {file && (
                    <div className="mt-4 p-2 bg-primary/10 text-primary rounded text-sm w-full font-medium truncate">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  <input
                    id="fileUpload"
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploadMutation.isPending || submitMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading Document...' : submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
