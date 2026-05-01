import fs from 'fs';

import { pemToJwk } from 'rsa-pem-to-jwk';

const privateKey = fs.readFileSync('./certs/private.pem', 'utf8');

let jwk;
try {
    jwk = pemToJwk(privateKey, undefined, 'sig');
    console.log(jwk);
} catch (error) {
    console.error('Error converting PEM to JWK:', error);
    process.exit(1);
}
