"use client";

import dynamic from 'next/dynamic';

// We dynamically import the App component and disable Server-Side Rendering (SSR).
// This completely prevents "Hydration Mismatch" errors when migrating from Vite,
// because Vite apps expect to only ever run on the client (browser), and components
// like Recharts or window-based logic will crash if rendered on the server first.
const App = dynamic(() => import('./App'), { ssr: false });

export default function Page() {
  return <App />;
}
