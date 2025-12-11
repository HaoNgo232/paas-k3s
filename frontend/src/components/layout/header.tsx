'use client';

import { UserNav } from '@/components/layout/user-nav';
import Link from 'next/link';

export function Header() {
    return (
        <div className="border-b">
            <div className="flex h-16 items-center px-4">
                <div className="flex items-center font-semibold">
                    <Link href="/dashboard">PaaS K3s</Link>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <UserNav />
                </div>
            </div>
        </div>
    );
}
