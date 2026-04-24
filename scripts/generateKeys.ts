import crypto from 'crypto';
import fs from 'fs';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
    },
    privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
    },
});

// Write keys to files
fs.writeFileSync('certs/public.pem', publicKey);
fs.writeFileSync('certs/private.pem', privateKey);

console.log('RSA keys generated successfully!');
console.log('Public key saved to: public.pem');
console.log('Private key saved to: private.pem');
