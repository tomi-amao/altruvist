export const sanitiseUrl = (input: string): string | null => {
  if (!input) return null;

  try {
    const url = new URL(input);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    // Force HTTPS
    url.protocol = "https:";
    return url.toString();
  } catch {
    // Retry with https:// prepended
    try {
      if (!/^https?:\/\//i.test(input)) {
        const urlWithHttps = `https://${input}`;
        const url = new URL(urlWithHttps);
        url.protocol = "https:";
        return url.toString();
      }
    } catch {
      return null;
    }
    return null;
  }
};
