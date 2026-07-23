import type { Metadata } from 'next';
import '../styles/index.css';
import '../styles/index.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Ne-goshow DSS',
  description: 'Agricultural Price Intelligence and Decision Support System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <QueryProvider>
            <LanguageProvider>
              <AppShell>
                {children}
              </AppShell>
            </LanguageProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
