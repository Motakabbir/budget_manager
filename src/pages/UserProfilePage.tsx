import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
    getUserProfile,
    upsertUserProfile,
    updateAvatar,
    deleteAvatar,
    getProfileStats,
    validateProfileData,
    UserProfile,
    ProfileStats,
} from '@/lib/services/user-profile.service';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Globe,
    Bell,
    Palette,
    TrendingUp,
    Wallet,
    Target,
    PieChart,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';

// Helper functions
const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    console.log(`[${variant.toUpperCase()}] ${title}: ${description}`);
};

const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

export default function UserProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        phone: '',
        date_of_birth: '',
        location: '',
        currency: 'USD',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        theme_preference: 'system' as 'light' | 'dark' | 'system',
        email_notifications: true,
        push_notifications: false,
    });

    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
            if (user) {
                setUser(user);
            }
        });
    }, []);

    useEffect(() => {
        if (user) {
            loadProfile();
            loadStats();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const data = await getUserProfile(user.id);
            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    phone: data.phone || '',
                    date_of_birth: data.date_of_birth || '',
                    location: data.location || '',
                    currency: data.currency,
                    language: data.language,
                    timezone: data.timezone,
                    theme_preference: data.theme_preference,
                    email_notifications: data.email_notifications,
                    push_notifications: data.push_notifications,
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Error', 'Failed to load profile data', 'destructive');
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        if (!user) return;

        try {
            const data = await getProfileStats(user.id);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
        setErrors([]);
    };

    const handleSave = async () => {
        if (!user) return;

        const validation = validateProfileData(formData);
        if (!validation.valid) {
            setErrors(validation.errors);
            showToast('Validation Error', validation.errors.join(', '), 'destructive');
            return;
        }

        setIsSaving(true);
        setErrors([]);

        try {
            const updated = await upsertUserProfile(user.id, formData);
            if (updated) {
                setProfile(updated);
                setHasChanges(false);
                showToast('Success', 'Profile updated successfully');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Error', 'Failed to update profile', 'destructive');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (file: File): Promise<string | null> => {
        if (!user) return null;

        try {
            const url = await updateAvatar(user.id, file);
            if (url) {
                setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null));
                showToast('Success', 'Avatar updated successfully');
                return url;
            }
            return null;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast('Error', 'Failed to upload avatar', 'destructive');
            return null;
        }
    };

    const handleAvatarDelete = async (): Promise<boolean> => {
        if (!user || !profile?.avatar_url) return false;

        try {
            const success = await deleteAvatar(user.id, profile.avatar_url);
            if (success) {
                setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
                showToast('Success', 'Avatar removed successfully');
            }
            return success;
        } catch (error) {
            console.error('Error deleting avatar:', error);
            showToast('Error', 'Failed to remove avatar', 'destructive');
            return false;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const memberSince = stats?.memberSince
        ? format(new Date(stats.memberSince), 'MMMM yyyy')
        : 'Recently';

    return (
        <div className="space-y-6 p-6">
            <PageHeader
                title="My Profile"
                description="Manage your account settings and preferences"
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Overview Card */}
                <Card className="lg:col-span-1 border-2 border-primary/10 bg-gradient-surface">
                    <CardHeader className="text-center pb-6">
                        <div className="flex justify-center mb-4">
                            <AvatarUpload
                                currentAvatarUrl={profile?.avatar_url}
                                onUpload={handleAvatarUpload}
                                onDelete={handleAvatarDelete}
                                userName={formData.full_name || user?.email}
                            />
                        </div>
                        <CardTitle className="text-2xl">{formData.full_name || 'User'}</CardTitle>
                        <CardDescription className="flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4" />
                            {user?.email}
                        </CardDescription>
                        <Badge variant="secondary" className="mx-auto mt-2">
                            Member since {memberSince}
                        </Badge>
                    </CardHeader>

                    {stats && (
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card rounded-lg p-4 border">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="text-xs">Transactions</span>
                                    </div>
                                    <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                                </div>

                                <div className="bg-card rounded-lg p-4 border">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Wallet className="h-4 w-4" />
                                        <span className="text-xs">Accounts</span>
                                    </div>
                                    <p className="text-2xl font-bold">{stats.accountsConnected}</p>
                                </div>

                                <div className="bg-card rounded-lg p-4 border">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Target className="h-4 w-4" />
                                        <span className="text-xs">Goals</span>
                                    </div>
                                    <p className="text-2xl font-bold">{stats.activeGoals}</p>
                                </div>

                                <div className="bg-card rounded-lg p-4 border">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <PieChart className="h-4 w-4" />
                                        <span className="text-xs">Budgets</span>
                                    </div>
                                    <p className="text-2xl font-bold">{stats.activeBudgets}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Income</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                        {formatCurrency(stats.totalIncome)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Total Expenses</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                        {formatCurrency(stats.totalExpenses)}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Net Savings</span>
                                    <span className="font-bold text-lg">
                                        {formatCurrency(stats.totalSavings)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Profile Settings */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Update your personal information and preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="personal" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="personal">
                                    <User className="h-4 w-4 mr-2" />
                                    Personal
                                </TabsTrigger>
                                <TabsTrigger value="preferences">
                                    <Palette className="h-4 w-4 mr-2" />
                                    Preferences
                                </TabsTrigger>
                                <TabsTrigger value="notifications">
                                    <Bell className="h-4 w-4 mr-2" />
                                    Notifications
                                </TabsTrigger>
                            </TabsList>

                            {/* Personal Information Tab */}
                            <TabsContent value="personal" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="+1 (555) 123-4567"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                value={formData.date_of_birth}
                                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="location"
                                                value={formData.location}
                                                onChange={(e) => handleInputChange('location', e.target.value)}
                                                placeholder="City, Country"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        placeholder="Tell us a bit about yourself..."
                                        rows={4}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {formData.bio.length}/500
                                    </p>
                                </div>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent value="preferences" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select
                                            value={formData.currency}
                                            onValueChange={(value) => handleInputChange('currency', value)}
                                        >
                                            <SelectTrigger id="currency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="language">Language</Label>
                                        <Select
                                            value={formData.language}
                                            onValueChange={(value) => handleInputChange('language', value)}
                                        >
                                            <SelectTrigger id="language">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="es">Español</SelectItem>
                                                <SelectItem value="fr">Français</SelectItem>
                                                <SelectItem value="de">Deutsch</SelectItem>
                                                <SelectItem value="pt">Português</SelectItem>
                                                <SelectItem value="zh">中文</SelectItem>
                                                <SelectItem value="ja">日本語</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="timezone"
                                                value={formData.timezone}
                                                onChange={(e) => handleInputChange('timezone', e.target.value)}
                                                className="pl-10"
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="theme">Theme</Label>
                                        <Select
                                            value={formData.theme_preference}
                                            onValueChange={(value: 'light' | 'dark' | 'system') =>
                                                handleInputChange('theme_preference', value)
                                            }
                                        >
                                            <SelectTrigger id="theme">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="system">System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Notifications Tab */}
                            <TabsContent value="notifications" className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="email_notifications" className="text-base">
                                                Email Notifications
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive email updates about your account activity
                                            </p>
                                        </div>
                                        <Switch
                                            id="email_notifications"
                                            checked={formData.email_notifications}
                                            onCheckedChange={(checked) =>
                                                handleInputChange('email_notifications', checked)
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="push_notifications" className="text-base">
                                                Push Notifications
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive push notifications on your devices
                                            </p>
                                        </div>
                                        <Switch
                                            id="push_notifications"
                                            checked={formData.push_notifications}
                                            onCheckedChange={(checked) =>
                                                handleInputChange('push_notifications', checked)
                                            }
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Error Display */}
                        {errors.length > 0 && (
                            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                    <div className="space-y-1">
                                        {errors.map((error, index) => (
                                            <p key={index} className="text-sm text-destructive">
                                                {error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="mt-6 flex justify-end gap-3">
                            {hasChanges && (
                                <Button
                                    variant="outline"
                                    onClick={loadProfile}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className="bg-gradient-primary text-white"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {hasChanges ? (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Saved
                                            </>
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
