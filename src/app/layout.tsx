import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import PWAInitializer from "@/components/PWAInitializer";

import InAppMessageHandler from "@/components/notifications/InAppMessageHandler";
import { InAppMessageTester } from "@/components/notifications/InAppMessageTester";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Gliter Argentina - Conecta con personas cerca de ti",
    template: "%s | Gliter Argentina",
  },
  description: "La app de citas gay más popular de Argentina. Conecta con personas cerca de ti de forma segura y divertida.",
  keywords: ["citas", "gay", "argentina", "lgbtq+", "conexiones", "amor"],
  authors: [{ name: "Gliter Argentina" }],
  creator: "Gliter Argentina",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://gliter.com.ar",
    siteName: "Gliter Argentina",
    title: "Gliter Argentina - Conecta con personas cerca de ti",
    description: "La app de citas gay más popular de Argentina. Conecta con personas cerca de ti de forma segura y divertida.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gliter Argentina",
    description: "La app de citas gay más popular de Argentina",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gliter Argentina",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Cleanup old Vite service workers in development
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      if (registration.scope.includes('vite') || registration.scope.includes('@vite')) {
                        registration.unregister();
                        console.log('Unregistered old Vite service worker:', registration.scope);
                      }
                    }
                  });
                }
              `,
            }}
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased h-full bg-background text-foreground`}>
        <ErrorBoundary>
          <ToastProvider>
            <ThemeProvider>
               <AuthProvider>
                <PWAInitializer />

          {children}
                 <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    },
                  }}
                />
              </AuthProvider>
            </ThemeProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
