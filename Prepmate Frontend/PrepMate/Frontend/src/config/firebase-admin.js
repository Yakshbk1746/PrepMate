const firebaseAdminObj = {
  "type": import.meta.env.VITE_FIREBASE_ADMIN_TYPE,
  "project_id": import.meta.env.VITE_FIREBASE_ADMIN_PROJECT_ID,
  "private_key_id": import.meta.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY_ID,
  "private_key": import.meta.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY,
  "client_email": import.meta.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL,
  "client_id": import.meta.env.VITE_FIREBASE_ADMIN_CLIENT_ID,
  "auth_uri": import.meta.env.VITE_FIREBASE_ADMIN_AUTH_URI,
  "token_uri": import.meta.env.VITE_FIREBASE_ADMIN_TOKEN_URI,
  "auth_provider_x509_cert_url": import.meta.env.VITE_FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": import.meta.env.VITE_FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
  "universe_domain": import.meta.env.VITE_FIREBASE_ADMIN_UNIVERSE_DOMAIN
}

export default firebaseAdminObj;