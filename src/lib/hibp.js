async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function checkHIBP(password) {
  try {
    const hash   = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    });

    if (!res.ok) return { count: null, error: true };

    const text  = await res.text();
    const lines = text.split('\r\n');
    const match = lines.find(line => line.startsWith(suffix));

    if (!match) return { count: 0 };
    const count = parseInt(match.split(':')[1], 10);
    return { count };

  } catch {
    return { count: null, error: true };
  }
}
