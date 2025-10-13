const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7dUei7Vehoe3i\nraFpur1T/rxPr/0TlIVzF0Qt4WVvDavJ3/IS+LAfmJapdeo7jf+sAAL/0MonODW5\nyUJsB9pngH0d3iu74f9xnc1N/x3VzjVTLXjF471yJ07IZEwY7b6JinBvliGSA0xq\nrP7/TC3eb+jFKwrB+Lf5yTobFbTFBXsbG2cjP9bL0vR9mMw7ku5PmlkG6BQykeUg\nxY+OIBWYXQiwcgGH39k96RWTePC7I3Mv45gcVQtSn1fszzgxAPZmUD3f+PnQ8cvR\naCdQz3XM3AA0ORPH0Thb1tnVVb4KHRTIwJOUWfd+AnLY9tqufsK8kMnBGQo3M59K\nHCKi7MINAgMBAAECggEABMF7nnKPCpa6cPR0Eo6eRwdAwnTLODfzEBxtqmGm2nkU\n+/t71Ly3xdVv3RS/azYLCn4QQBU39mQYA4Kg9hoCPHtSBp6gVWqXucuFwzjPCkw/\nphXn6SgB97zE5D3x1aASeW19tMGw+wICak0WmxDVCROlwCV7Zw28UntRx2Yhk+39\n4pePukq6JRht3WAzwZm3Oqact2KH9fY/EcHThVjcRf1JdMjYab2da6wRMeKkeQTM\nvh4mCnxEdUoVqE/qyRzBwup3l3KXjXAndUGOTrAQrZidu+BCWIPeT7/j5RI50wcb\nQcCOocGVryuCibQhb3OF8srAq0uEEHtZ95nIvmtVMQKBgQDcosEatXlLhha7FRFW\nX8dxcGqWbEVvjgOSrcyPe2UembUskYtielY3XjYHjDuPmlsuRXygpMx9ymI8UwPN\nXvAholQj5ZxeL4/ZsLdoWUs51pWX1pQ+G47IcKWNLtMdB4d2K15p0BY3aGj6yaGD\nv5Vva0633cPF+ZGbtp/d4ekdXwKBgQDZgSmylaKM8Ss+DrQKNoNNZIxx0mKxS4eY\nCvTnJ5yJi6gmhz7rBgpGUgYQmgyRN/1fxTWsBuIEkUpooIg4XYep6Ob7GDQdKlum\nKFXeVtFRDoFuCchrNkkv7RyenpaB0WBNZFc5N8+kDGH7dzYP92LZOOz01O8hItRY\nHN1Rp/TsEwKBgHW/5o76iuFjjn4JoFcYhrhj5n6hCe2fPQjq+GEa2bybC7XddyX3\nZEvoW61rid354u+u5fRV/0yi1gqbw0u3fzB0EbOWtv0NJRho13k5LoyPmQaP3k3H\nJ0yR0cinVMQJYKIQQzL1euXXMy+krC5D8NylyD0YfYMKzkrsDCW+i0rBAoGAbIL8\nApSUnCxVnohHWjEIILxhNQf5JOrBoyEUPZ6NgjGimlYvFaHVzm9thyrTyj9csUL6\nG/DzIcQ6kyhDzZsb67C+S9cvaL2RK7xD2sEFfKL3/6Xxz0suCDMLbDdCb1G98d51\nhZ5KgVWMLKC04BJTxnuX/C2ff7CYr7z2zZ41mvECgYBOhUIgYVb/xsatd5KGD9jV\nTkGK8TNkqg+4fV6fJ1+IgEjjlyum+Q+GfaKHPnOgS5hw0qMRm9CvJ7kxhrkvq0F2\nHV+C6xBv9TJr22ljfmdG4B5BEDq/rabq5/BH26s5AmzW0h/JJRZ60vLT+vE4dATX\nrUPqB6a+gujY6rpGERo9nA==\n-----END PRIVATE KEY-----\n",
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};


const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

const bucket = getStorage().bucket();

const messaging = getMessaging(app);

module.exports = { bucket, messaging };
