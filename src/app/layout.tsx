import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "../utils/toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import PWAInitializer from "@/components/PWAInitializer";
import InAppMessageHandler from "@/components/notifications/InAppMessageHandler";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

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
  // Critical PWA meta tags
  other: {
    'theme-color': '#6366f1',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Gliter Argentina',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#6366f1',
    'msapplication-config': '/browserconfig.xml',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
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
        {/* Enhanced Service Worker management for mobile browsers */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced Service Worker management for mobile browsers
              (function() {
                // Skip in development to avoid InvalidStateError
                if (typeof window === 'undefined' || !window.location) return;
                
                // Detect mobile browser vs installed PWA
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                                   window.navigator.standalone ||
                                   document.referrer.includes('android-app://');
                
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // Only run cleanup in production and not in standalone mode
                if (${process.env.NODE_ENV === 'production'} && !isStandalone && 'serviceWorker' in navigator) {
                  try {
                    // Add delay for mobile browsers to ensure DOM is ready
                    const cleanup = function() {
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        registrations.forEach(function(registration) {
                          // Only cleanup old Vite service workers, not our current ones
                          if (registration.scope.includes('vite') || 
                              registration.scope.includes('@vite') ||
                              registration.scope.includes('webpack')) {
                            registration.unregister().then(function() {
                              console.log('Cleaned up old service worker:', registration.scope);
                            }).catch(function(error) {
                              console.warn('Failed to unregister service worker:', error);
                            });
                          }
                        });
                      }).catch(function(error) {
                        console.warn('Error accessing service worker registrations:', error);
                      });
                    };
                    
                    // Delay cleanup on mobile browsers
                    if (isMobile) {
                      setTimeout(cleanup, 1000);
                    } else {
                      cleanup();
                    }
                  } catch (error) {
                    console.warn('Service worker cleanup error:', error);
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased h-full bg-background text-foreground`}>
        <ErrorBoundary>
          <ToastProvider>
            <ThemeProvider>
              <AuthProvider>
                <PWAInitializer />
                <InAppMessageHandler />
                <PWAInstallPrompt />
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
