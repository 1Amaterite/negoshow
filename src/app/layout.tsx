import type { Metadata } from 'next';
import '../styles/index.css';
import { GlobalProvider } from '@/lib/GlobalContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppShell } from '@/components/AppShell';
import { QueryProvider } from '@/components/QueryProvider';

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
        <QueryProvider>
          <GlobalProvider>
            <LanguageProvider>
              <AppShell>
                {children}
              </AppShell>
            </LanguageProvider>
          </GlobalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
