/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  /** e.g. http://127.0.0.1:9099 to use the Firebase Auth emulator */
  readonly VITE_FIREBASE_AUTH_EMULATOR?: string
  /** browser key for the Maps JavaScript API */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** optional Google Cloud map ID (DEMO_MAP_ID is used otherwise) */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string
}
