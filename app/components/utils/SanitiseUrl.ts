export const sanitiseUrl = (url: string): string | null => {
  if (!url) return null;

  try {
    // Try to create a URL object to validate the URL
    const urlObject = new URL(url);

    // Only allow https protocol
    if (urlObject.protocol === "https:") {
      return url;
    } else if (urlObject.protocol === "http:") {
      // Convert HTTP to HTTPS
      return `https://${urlObject.host}${urlObject.pathname}${urlObject.search}${urlObject.hash}`;
    }
    return null;
  } catch (e) {
    // If URL parsing fails, try adding https:// prefix and retry
    try {
      if (!url.match(/^https?:\/\//i)) {
        const urlWithProtocol = `https://${url}`;
        const urlObject = new URL(urlWithProtocol);
        return urlWithProtocol;
      }
    } catch {
      // If it still fails, return null
    }
    return null;
  }
};