import crypto from 'crypto';

const defaultAlgorithm = 'aes-256-ctr';
const secretKey = process.env.ZOSO_PASSWORD;

if (!secretKey || secretKey.length !== 44) {
  throw new Error('ZOSO_PASSWORD not set');
}

const encryptionKey = Buffer.from(secretKey, 'base64');

export function encrypt(data: any) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(defaultAlgorithm, Buffer.from(encryptionKey), iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    throw err;
  }
}

export function decrypt(data: any) {
  const textParts = data.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(defaultAlgorithm, Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function encryptAdvanced(text: string, password: string, algorithm = 'aes256') {
  const key = crypto.createHash('sha256').update(password).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encryptedMessage = iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return encryptedMessage
}

export function decryptAdvanced(text: string, password: string, algorithm = 'aes256') {
  const key = crypto.createHash('sha256').update(password).digest();
  const [ivText, hash] = text.split(':');
  const iv = Buffer.from(ivText, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decryptedMessage = decipher.update(hash, 'hex', 'utf-8') + decipher.final('utf8');
  return decryptedMessage.toString(); // utf-8
}