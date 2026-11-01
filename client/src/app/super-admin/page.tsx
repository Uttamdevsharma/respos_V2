'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/super-admin/overview');
  }, [router]);

  return null;
}
