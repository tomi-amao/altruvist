export function getZitadelVars() {
  return {
    ZITADEL_DOMAIN: process.env.ZITADEL_DOMAIN ?? "",
    CLIENT_ID: process.env.CLIENT_ID ?? "",
    CLIENT_SECRET: process.env.CLIENT_SECRET ?? "",
    REDIRECT_URI: process.env.REDIRECT_URI ?? "",
    LOGOUT_URI: process.env.LOGOUT_URI ?? "",
    STATE: process.env.STATE ?? "",
    MACHINE_API_KEY: process.env.MACHINE_API_KEY ?? "",
    ZITADEL_ADMIN_TOKEN: process.env.ZITADEL_ADMIN_TOKEN ?? "",
  };
}

export function getFeatureFlags() {
  return {
    FEATURE_FLAG: process.env.FEATURE_FLAG === "true",
  };
}
export function getS3Credentials() {
  return {
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
    SECRET_ACCESS_KEY: process.env.AWS_SECRET ?? "",
    REGION: process.env.AWS_REGION ?? "",
    BUCKET: process.env.AWS_BUCKET ?? "",
  };
}

export function getMeiliVars() {
  return {
    MEILI_HOST: process.env.MEILI_HOST ?? "",
    MEILI_MASTER_KEY: process.env.MEILI_MASTER_KEY ?? "",
  };
}


export function getCompanionVars() {
  return {
    COMPANION_URL: process.env.COMPANION_URL ?? "",
  };
}