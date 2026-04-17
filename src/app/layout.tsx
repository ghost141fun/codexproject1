import type { Metadata } from 'next';
import './globals.css';
import { DatabaseClientProvider } from '@/database/client-provider';
import { AppearanceInitializer } from '@/components/appearance-initializer';

export const metadata: Metadata = {
  title: 'Codex Teams | Collaborative Engineering Workspace',
  description: 'Real-time messaging for developers with AI-powered summaries.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var config = JSON.parse(localStorage.getItem('devtalk-appearance'));
              if (config) {
                if (config.theme === 'light') {
                  document.documentElement.classList.add('light-mode');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light-mode');
                }
                if (config.accent) {
                  var accents = {
                    purple: '262 83% 58%',
                    blue: '217 91% 60%',
                    emerald: '160 84% 39%',
                    rose: '343 88% 60%',
                    orange: '25 95% 53%'
                  };
                  if (accents[config.accent]) {
                    document.documentElement.style.setProperty('--primary', accents[config.accent]);
                    document.documentElement.style.setProperty('--ring', accents[config.accent]);
                    document.documentElement.style.setProperty('--accent', accents[config.accent]);
                  }
                }
                if (config.fontSize) {
                  document.documentElement.style.fontSize = config.fontSize + 'px';
                }
                if (config.fontFamily) {
                  var fonts = {
                    inter: "'Inter', sans-serif",
                    roboto: "'Roboto', sans-serif",
                    system: "system-ui, -apple-system, sans-serif"
                  };
                  if (fonts[config.fontFamily]) {
                    document.documentElement.style.setProperty('--font-family', fonts[config.fontFamily]);
                    document.documentElement.style.fontFamily = fonts[config.fontFamily];
                  }
                }
              } else {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })()
        `}} />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 selection:text-primary-foreground">
        <AppearanceInitializer />
        <DatabaseClientProvider>
          {children}
        </DatabaseClientProvider>
      </body>
    </html>
  );
}
