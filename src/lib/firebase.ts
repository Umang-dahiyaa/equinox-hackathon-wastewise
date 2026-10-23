import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const firebaseConfigured = !!(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseConfigured) {
  app = initializeApp(config)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { db }

/** Signs the device in anonymously (no sign-up form) and resolves its uid. */
export function ensureAnonymousUser(): Promise<string> {
  if (!auth) return Promise.reject(new Error("Firebase is not configured"))
  const a = auth
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(a, (user) => {
      if (user) {
        unsub()
        resolve(user.uid)
      }
    })
    if (!a.currentUser) signInAnonymously(a).catch((err) => {
      unsub()
      reject(err)
    })
  })
}
