import { Suspense } from 'react';

import SnippetsPageClient from './snippets-page-client';

export default function SnippetsPage() {
  return (
    <Suspense fallback={<div className="snippet-page" />}>
      <SnippetsPageClient />
    </Suspense>
  );
}
