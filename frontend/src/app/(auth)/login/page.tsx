'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Github } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        // Redirect đến backend endpoint để bắt đầu OAuth flow
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        globalThis.location.href = `${apiUrl}/auth/github`;
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        PaaS K3s Platform
                    </CardTitle>
                    <CardDescription>
                        Đăng nhập để quản lý hạ tầng và ứng dụng của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Button
                        variant="default"
                        type="button"
                        disabled={isLoading}
                        onClick={handleLogin}
                        className="w-full"
                    >
                        {isLoading ? (
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <Github className="mr-2 h-4 w-4" />
                        )}
                        Đăng nhập bằng GitHub
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
