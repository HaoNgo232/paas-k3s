import { Suspense } from 'react';
import { AuthCallbackContent } from '@/features/auth/components/auth-callback-content';

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
