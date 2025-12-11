'use client';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
