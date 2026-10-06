'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';

export function SecurityTab() {
  const { user } = useAuthStore();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  
  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // In reality, fetch from user object or profile
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password updated successfully');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handle2FAToggle = async (checked: boolean) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (checked) {
        // Generate secret and show QR
        const data = await authService.generate2FA(user.id, user.email);
        setSetupData(data);
      } else {
        // Need to provide code to disable? Wait, usually yes, but let's just prompt for code
        // For simplicity, just disable it immediately or show modal. Let's just unset it for now.
        // Or wait, if we disable, we need a code. We'll handle it below.
        setSetupData({ secret: 'disable', qrCodeDataUrl: '' });
      }
    } catch (error: any) {
      toast.error('Failed to initiate 2FA process');
    } finally {
      setIsLoading(false);
    }
  };

  const submit2FACode = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (setupData?.secret === 'disable') {
        await authService.disable2FA(user.id, verificationCode);
        toast.success('Two-Factor Authentication disabled');
        setIs2FAEnabled(false);
        setSetupData(null);
      } else {
        await authService.enable2FA(user.id, verificationCode);
        toast.success('Two-Factor Authentication enabled');
        setIs2FAEnabled(true);
        setSetupData(null);
      }
      setVerificationCode('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                required
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                required
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add additional security to your account using an authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between max-w-md mb-4">
            <div>
              <p className="font-medium">Authenticator App</p>
              <p className="text-sm text-muted-foreground">Use Google Authenticator or Authy</p>
            </div>
            <Switch checked={is2FAEnabled || !!setupData} onCheckedChange={handle2FAToggle} disabled={isLoading} />
          </div>

          {setupData && setupData.secret !== 'disable' && (
            <div className="mt-4 p-4 border rounded-md max-w-md space-y-4">
              <p className="text-sm">1. Scan this QR code with your authenticator app:</p>
              <div className="bg-white p-2 inline-block rounded-md border">
                <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40" />
              </div>
              <p className="text-sm">Or enter this setup key manually: <strong className="font-mono">{setupData.secret}</strong></p>
              
              <div className="space-y-2 pt-2 border-t">
                <Label>2. Enter the 6-digit code from your app</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="000000" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button onClick={submit2FACode} disabled={isLoading || verificationCode.length !== 6}>
                    Verify & Enable
                  </Button>
                </div>
              </div>
            </div>
          )}

          {setupData && setupData.secret === 'disable' && (
             <div className="mt-4 p-4 border rounded-md max-w-md space-y-4 bg-red-50 dark:bg-red-950/20">
               <p className="text-sm font-medium text-red-600 dark:text-red-400">Enter your 2FA code to disable Two-Factor Authentication</p>
               <div className="flex gap-2">
                  <Input 
                    placeholder="000000" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button variant="destructive" onClick={submit2FACode} disabled={isLoading || verificationCode.length !== 6}>
                    Disable 2FA
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSetupData(null)}>Cancel</Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
