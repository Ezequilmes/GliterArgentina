'use client';

import { useEffect, useState } from 'react';
import { app } from '@/lib/firebase';

export default function TestFirebaseInitPage() {
  const [initStatus, setInitStatus] = useState<any>({});

  useEffect(() => {
    console.log('🔍 Testing Firebase initialization...');
    console.log('App object:', app);
    console.log('App name:', app?.name);
    console.log('Project ID:', app?.options?.projectId);
    console.log('App options:', app?.options);

    setInitStatus({
      appExists: !!app,
      appName: app?.name || 'undefined',
      projectId: app?.options?.projectId || 'undefined',
      apiKey: app?.options?.apiKey ? 'Set' : 'Missing',
      authDomain: app?.options?.authDomain || 'undefined',
      storageBucket: app?.options?.storageBucket || 'undefined',
      messagingSenderId: app?.options?.messagingSenderId || 'undefined',
      appId: app?.options?.appId || 'undefined'
    });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔥 Firebase Initialization Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Firebase App Status</h2>
        <div className="space-y-2">
          <div>
            <strong>App Exists:</strong> 
            <span className={`ml-2 px-2 py-1 rounded ${initStatus.appExists ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {initStatus.appExists ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div><strong>App Name:</strong> {initStatus.appName}</div>
          <div><strong>Project ID:</strong> {initStatus.projectId}</div>
          <div><strong>API Key:</strong> {initStatus.apiKey}</div>
          <div><strong>Auth Domain:</strong> {initStatus.authDomain}</div>
          <div><strong>Storage Bucket:</strong> {initStatus.storageBucket}</div>
          <div><strong>Messaging Sender ID:</strong> {initStatus.messagingSenderId}</div>
          <div><strong>App ID:</strong> {initStatus.appId}</div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(initStatus, null, 2)}
        </pre>
      </div>
    </div>
  );
}