import { initializeApp, type FirebaseApp } from "firebase/app"
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User } from "firebase/auth"
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
  // local testing: VITE_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099 uses the Firebase Auth emulator
  const emulator = env.VITE_FIREBASE_AUTH_EMULATOR as string | undefined
  if (emulator) connectAuthEmulator(auth, emulator, { disableWarnings: true })
}

export { auth, db }

/** Calls back with the signed-in user whenever it changes (guest, account, or none). */
export function watchUser(cb: (user: User | null) => void) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, cb)
}

/** Signs the device in anonymously (no sign-up form) and resolves its uid. */
export async function ensureAnonymousUser(): Promise<string> {
  if (!auth) throw new Error("Firebase is not configured")
  const a = auth
  if (a.currentUser) {
    try {
      await a.currentUser.getIdToken(false)
      return a.currentUser.uid
    } catch {
      await a.signOut().catch(() => {})
    }
  }
  return new Promise((resolve, reject) => {
    let resolved = false
    const unsub = onAuthStateChanged(a, (user) => {
      if (user && !resolved) {
        resolved = true
        unsub()
        resolve(user.uid)
      }
    })
    signInAnonymously(a)
      .then((cred) => {
        if (!resolved) {
          resolved = true
          unsub()
          resolve(cred.user.uid)
        }
      })
      .catch((err) => {
        if (!resolved) {
          resolved = true
          unsub()
          reject(err)
        }
      })
  })
}
