'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getToken } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

    useEffect(() => {
        const token = getToken();
        const user = getUser();

        if (!token || !user) {
            router.push('/login');
            return;
        }

        if (user.role === 'DRIVER') {
            router.push('/driver/dashboard');
        } else {
            router.push('/passenger/dashboard');
        }
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Redirecting...</p>
        </div>
    );
};