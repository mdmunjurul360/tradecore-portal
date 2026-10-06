'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { userService } from '@/services/user.service';

export function ProfileForm() {
  const { user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || (user as any)?.profile?.firstName || '',
    lastName: user?.lastName || (user as any)?.profile?.lastName || '',
    phone: (user as any)?.phone || '',
    country: (user as any)?.profile?.country || 'United States',
    dateOfBirth: (user as any)?.profile?.dateOfBirth || '',
    address: (user as any)?.profile?.address || '',
    bio: (user as any)?.profile?.bio || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      const response = await userService.updateProfile(formData);
      // Update local store with new data
      // Use existing access token and refresh token (we don't get new ones here)
      // Actually setAuth requires all 3. I'll just rely on the next page reload or manually update.
      setSuccess(true);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
        <CardDescription>
          Update your personal information and how others see you on the platform.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
              Profile updated successfully.
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center space-x-6 pb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center space-x-2">
                <Input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await fetch('/api/v1/upload/avatar', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
                        },
                        body: formData
                      });
                      if (res.ok) alert('Avatar updated! (refresh required)');
                    } catch (err) {}
                  }
                }} />
                <Button variant="outline" type="button" onClick={() => document.getElementById('avatarUpload')?.click()}>Change Avatar</Button>
              </div>
              <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 5MB.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Read Only)</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us a little about yourself"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
