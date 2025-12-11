'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (token) {
            loginWithToken(token);
            router.push(ROUTES.DASHBOARD);
        } else if (error) {
            console.error('Auth error:', error);
            router.push(`${ROUTES.LOGIN}?error=${error}`);
        } else {
            // No token or error, redirect to login
            router.push(ROUTES.LOGIN);
        }
    }, [searchParams, loginWithToken, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Authenticating...</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
