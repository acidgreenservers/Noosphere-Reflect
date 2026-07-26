import React from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    return (
        <div className="flex w-screen h-screen bg-[#0e1511] text-gray-200 overflow-hidden font-sans">
            {/* Persistant Collapsible Left Sidebar */}
            <Sidebar />

            {/* Right Main Content Panel */}
            <div className="flex-1 h-full flex flex-col min-w-0 bg-[#0e1511]">
                {children}
            </div>
        </div>
    );
};

export default AppShell;
