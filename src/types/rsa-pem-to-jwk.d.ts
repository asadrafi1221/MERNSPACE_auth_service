declare module 'rsa-pem-to-jwk' {
    export function pemToJwk(
        pem: string,
        kid?: string,
        use?: 'sig' | 'enc',
    ): {
        kty: string;
        n: string;
        e: string;
        d?: string;
        p?: string;
        q?: string;
        dp?: string;
        dq?: string;
        qi?: string;
        kid?: string;
        use?: string;
    };
}
