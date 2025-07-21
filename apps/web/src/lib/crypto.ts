const ENCRYPTION_KEY = 'ectoo-encryption-key-2024';

export async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0')),
    'AES-GCM',
    false,
    ['encrypt'],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedText: string): Promise<string> {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0')),
    'AES-GCM',
    false,
    ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
