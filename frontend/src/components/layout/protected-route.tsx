'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

interface ProtectedRouteProps {
    readonly children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isInitialized } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Đợi initialize xong mới redirect
        if (isInitialized && !isLoading && !isAuthenticated) {
            const from = encodeURIComponent(pathname);
            router.push(`${ROUTES.LOGIN}?from=${from}`);
        }
    }, [isInitialized, isLoading, isAuthenticated, router, pathname]);

    // Show loading khi đang initialize hoặc đang fetch user
    if (!isInitialized || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
