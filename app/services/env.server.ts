export function getZitadelVars() {
  return {
    ZITADEL_DOMAIN: process.env.ZITADEL_DOMAIN ?? "",
    CLIENT_ID: process.env.CLIENT_ID ?? "",
    REDIRECT_URI: process.env.REDIRECT_URI ?? "",
    LOGOUT_URI: process.env.LOGOUT_URI ?? "",
    STATE: process.env.STATE ?? "",
  };
}
