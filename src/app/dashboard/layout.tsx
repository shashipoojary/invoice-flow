'use client';

import { SettingsProvider } from '@/contexts/SettingsContext';
import { DataProvider } from '@/contexts/DataContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </SettingsProvider>
  );
}
