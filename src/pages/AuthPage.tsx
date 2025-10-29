import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { Wallet } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [signInData, setSignInData] = useState({ email: '', password: '' });
    const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '' });

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: signInData.email,
            password: signInData.password,
        });

        if (error) {
            alert(error.message);
        } else {
            navigate('/dashboard');
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: signUpData.email,
            password: signUpData.password,
        });

        if (error) {
            alert(error.message);
        } else if (data.user) {
            // Create profile
            await supabase.from('profiles').insert({
                id: data.user.id,
                email: signUpData.email,
                full_name: signUpData.fullName,
            } as any);

            alert('Account created! Please sign in.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 relative">
            {/* Theme Toggle in top-right corner */}
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Wallet className="h-12 w-12 text-primary" />
                        <h1 className="text-4xl font-bold text-foreground">Budget Manager</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Track your finances with ease
                    </p>
                </div>

                <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sign In</CardTitle>
                                <CardDescription>
                                    Enter your credentials to access your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div>
                                        <Label htmlFor="signin-email">Email</Label>
                                        <Input
                                            id="signin-email"
                                            type="email"
                                            value={signInData.email}
                                            onChange={(e) =>
                                                setSignInData({ ...signInData, email: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="signin-password">Password</Label>
                                        <Input
                                            id="signin-password"
                                            type="password"
                                            value={signInData.password}
                                            onChange={(e) =>
                                                setSignInData({ ...signInData, password: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sign Up</CardTitle>
                                <CardDescription>
                                    Create a new account to get started
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div>
                                        <Label htmlFor="signup-name">Full Name</Label>
                                        <Input
                                            id="signup-name"
                                            value={signUpData.fullName}
                                            onChange={(e) =>
                                                setSignUpData({ ...signUpData, fullName: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="signup-email">Email</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            value={signUpData.email}
                                            onChange={(e) =>
                                                setSignUpData({ ...signUpData, email: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="signup-password">Password</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            value={signUpData.password}
                                            onChange={(e) =>
                                                setSignUpData({ ...signUpData, password: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Creating account...' : 'Sign Up'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
