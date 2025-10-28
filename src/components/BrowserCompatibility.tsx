'use client';

import { useEffect, useState } from 'react';
import { detectBrowser, logBrowserInfo, type BrowserInfo } from '@/utils/browserDetection';
import { AlertTriangle, Info, ExternalLink } from 'lucide-react';

interface BrowserCompatibilityProps {
  showDetails?: boolean;
  className?: string;
}

export default function BrowserCompatibility() {
  // Component removed - PWA works in all modern browsers
  return null;
}