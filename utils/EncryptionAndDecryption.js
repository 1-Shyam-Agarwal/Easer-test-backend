require('dotenv').config(); // Load environment variables from .env
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex'); // Retrieve and parse the secret key from .env
const iv = crypto.randomBytes(16); // Generate a new Initialization Vector (IV) for each encryption

// Encrypt data
exports.encrypt = (data) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final(),
    ]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

// Decrypt data
exports.decrypt = (encryption) => {
    const decipher = crypto.createDecipheriv(
        algorithm,
        secretKey,
        Buffer.from(encryption.iv, 'hex')
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryption.encryptedData, 'hex')),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
};
