// Use the configured public origin behind proxies; never trust forwarded hosts.
export function isAppOrigin(request, site = process.env.APP_URL) {
  try {
    const origin = request.headers.get('origin');
    const expected = new URL(site || request.url).origin;
    return !!origin && origin !== 'null' && origin === expected;
  } catch {
    return false;
  }
}
