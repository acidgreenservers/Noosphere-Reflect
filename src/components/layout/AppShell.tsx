import React from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-screen bg-[#0A0A0A] overflow-hidden text-gray-100 font-sans">
            <Sidebar />
            <main className="flex-1 h-full overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
