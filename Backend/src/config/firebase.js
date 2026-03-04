import admin from "firebase-admin";

let initializedApp = null;

const requiredEnvKeys = [
  "GOOGLE_TYPE",
  "GOOGLE_PROJECT_ID",
  "GOOGLE_PRIVATE_KEY_ID",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_AUTH_URI",
  "GOOGLE_TOKEN_URI",
  "GOOGLE_AUTH_PROVIDER_CERT_URL",
  "GOOGLE_CLIENT_CERT_URL",
];

const hasFirebaseEnv = () => {
  return requiredEnvKeys.every((key) => Boolean(process.env[key]));
};

export const getFirebaseAdmin = () => {
  if (initializedApp) {
    return admin;
  }

  if (!hasFirebaseEnv()) {
    const error = new Error("Firebase Admin configuration is missing");
    error.status = 500;
    error.errorCode = "FIREBASE_CONFIG_MISSING";
    throw error;
  }

  const serviceAccount = {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
  };

  initializedApp =
    admin.apps[0] ||
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  return admin;
};

export default getFirebaseAdmin;
