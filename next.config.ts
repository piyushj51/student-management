import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components (Partial Prerendering) is enabled by default for new apps.
  // Route handlers and pages that read live data opt out with `connection()`
  // and `<Suspense>` rather than with route segment config.
  cacheComponents: true,
  partialPrefetching: true,

  // `better-sqlite3` is a native module and must be required, not bundled.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
