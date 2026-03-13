import type { Metadata } from 'next';
import './globals.css';
import { DatabaseClientProvider } from '@/database/client-provider';

export const metadata: Metadata = {
  title: 'DevTalk | Collaborative Engineering Workspace',
  description: 'Real-time messaging for developers with AI-powered summaries.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary-foreground">
        <DatabaseClientProvider>
          {children}
        </DatabaseClientProvider>
      </body>
    </html>
  );
}
