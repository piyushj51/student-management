'use client';

/**
 * Client side re-export of `next/link`.
 *
 * Next.js 16 does not allow passing the server version of `Link` to a client
 * component's `component` prop, so Material UI buttons and list items import
 * this wrapper instead.
 */
import Link from 'next/link';

export default Link;
