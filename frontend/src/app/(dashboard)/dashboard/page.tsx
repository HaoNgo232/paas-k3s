'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <div className="container mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p>Welcome, <strong>{user?.name || user?.email}</strong>!</p>
                        <p className="text-sm text-gray-500">User ID: {user?.id}</p>
                        <Button onClick={logout} variant="destructive">
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
