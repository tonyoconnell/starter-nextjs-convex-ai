import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Monitor and manage logging system health</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}