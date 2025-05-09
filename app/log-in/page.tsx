'use client';

import {signIn} from 'next-auth/react';
import {useSearchParams} from 'next/navigation';
import {useEffect} from "react";

export default function Page() {
    const searchParams = useSearchParams();
    const redirectURL = searchParams.get('callbackUrl');
    useEffect(() => {
        signIn('keycloak', {callbackUrl: redirectURL});
    }, []);

    return 'Logging in...';
}
