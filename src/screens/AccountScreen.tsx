// Account: create an account or sign in (email + password or Google), reset a password,
// verify an email, sign out. Guests keep using the app; creating an account keeps their points.

import { useState } from "react"
import { ArrowLeft, Eye, EyeOff, LogOut, Mail, MailCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  accountsAvailable,
  authMessage,
  continueWithGoogle,
  createAccount,
  resendVerification,
  resetPassword,
  signIn,
  signOutToGuest,
  useAccount,
  type Account,
} from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useApp } from "@/state/AppContext"

type Mode = "create" | "signin" | "reset"

export function AccountScreen({ mode: initialMode = "create" }: { mode?: Mode }) {
  const { navigate } = useApp()
  const account = useAccount()

  return (
    <div className="space-y-4 px-4 pt-4 pb-32 lg:mx-auto lg:max-w-[520px] lg:pt-10 lg:pb-16">
      <header className="flex items-center gap-2">
        <Button variant="secondary" size="icon" aria-label="Back to Profile" onClick={() => navigate({ name: "profile" })}>
          <ArrowLeft size={22} />
        </Button>
        <h1 className="display text-3xl">Your account</h1>
      </header>

      {!accountsAvailable ? (
        <p className="glass p-5 text-sm text-ink">Accounts need the Firebase settings in .env.local. Until then, your points are kept on this device.</p>
      ) : !account ? (
        <p className="glass p-5 text-sm text-sub">Connecting…</p>
      ) : account.isGuest ? (
        <GuestForms initialMode={initialMode} />
      ) : (
        <SignedIn account={account} />
      )}
    </div>
  )
}

// ---------- guest: create account / sign in / reset ----------

function GuestForms({ initialMode }: { initialMode: Mode }) {
  const { toast, navigate, profile } = useApp()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "reset") {
      return run(async () => {
        await resetPassword(email)
        setSent(email.trim())
      })
    }
    return run(async () => {
      if (mode === "create") {
        const a = await createAccount(email, password)
        toast(`Account created for ${a.email}. Check your inbox to verify it.`, "happy")
      } else {
        const a = await signIn(email, password)
        toast(`Signed in as ${a.email}`, "happy")
      }
      navigate({ name: "profile" })
    })
  }

  const google = () =>
    run(async () => {
      const { account, switched } = await continueWithGoogle()
      toast(switched ? `Signed in as ${account.email ?? account.name}` : `Account created with Google (${account.email})`, "happy")
      navigate({ name: "profile" })
    })

  const guestPoints = profile?.points ?? 0

  return (
    <div className="glass space-y-4 p-5">
      {mode !== "reset" && (
        <>
          <div role="tablist" aria-label="Account" className="tile grid grid-cols-2 gap-1 p-1">
            {(["create", "signin"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => (setMode(m), setError(null))}
                className={cn("ww-press h-10 rounded-[12px] text-sm font-semibold transition-colors", mode === m ? "bg-card text-ink shadow-soft" : "text-sub")}
              >
                {m === "create" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <p className="text-sm text-sub">
            {mode === "create"
              ? "Keep your points, streak and leaderboard name on any device. Your guest progress carries over."
              : "Use the account you created on another device."}
          </p>
          {mode === "signin" && guestPoints > 0 && (
            <p className="chip-ai rounded-[14px] px-3 py-2 text-xs font-semibold">
              Signing in switches to that account. This guest's {guestPoints} points stay with the guest; to keep them, create an account instead.
            </p>
          )}

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="ww-press pill-glass flex min-h-12 w-full items-center justify-center gap-2.5 px-4 text-[15px] font-semibold disabled:opacity-60"
          >
            <GoogleMark /> Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.12em] text-sub">
            <span className="h-px flex-1 bg-green/15" /> OR WITH EMAIL <span className="h-px flex-1 bg-green/15" />
          </div>
        </>
      )}

      {mode === "reset" && (
        <div>
          <h2 className="font-bold text-ink">Reset your password</h2>
          <p className="text-sm text-sub">We'll email you a link to choose a new one.</p>
        </div>
      )}

      {sent ? (
        <div className="tile flex items-start gap-3 px-4 py-3 text-sm">
          <MailCheck size={20} className="mt-0.5 shrink-0 text-green" />
          <p className="text-ink">
            If there's an account for <span className="font-semibold">{sent}</span>, a reset link is on its way. Check your inbox and spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field h-12 w-full px-5 text-[15px]"
            />
          </label>
          {mode !== "reset" && (
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-sm font-semibold text-ink">
                Password
                {mode === "signin" && (
                  <button type="button" onClick={() => (setMode("reset"), setError(null))} className="text-xs font-semibold text-green">
                    Forgot password?
                  </button>
                )}
              </span>
              <span className="relative block">
                <input
                  type={show ? "text" : "password"}
                  autoComplete={mode === "create" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "create" ? "At least 6 characters" : "Your password"}
                  className="field h-12 w-full pr-12 pl-5 text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-sub hover:text-ink"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          )}

          {error && (
            <p role="alert" className="chip-alert rounded-[14px] px-3 py-2 text-sm font-semibold">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy || !email.trim() || (mode !== "reset" && !password)}>
            {busy ? "Please wait…" : mode === "create" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
          </Button>
        </form>
      )}

      {mode === "reset" && (
        <button onClick={() => (setMode("signin"), setSent(null), setError(null))} className="w-full text-center text-sm font-semibold text-green">
          Back to sign in
        </button>
      )}
    </div>
  )
}

// ---------- signed in ----------

function SignedIn({ account }: { account: Account }) {
  const { toast, profile } = useApp()
  const [busy, setBusy] = useState(false)
  const initial = (account.name || account.email || "?").trim()[0]?.toUpperCase()
  const methods = account.providers.map((p) => (p === "google.com" ? "Google" : p === "password" ? "Email & password" : p))

  const out = async () => {
    setBusy(true)
    try {
      await signOutToGuest()
      toast("Signed out. You're browsing as a guest.", "info")
    } catch (err) {
      toast(authMessage(err), "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-4 p-5">
        {account.photo ? (
          <img src={account.photo} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-green text-2xl font-bold text-white">{initial}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink">{account.name || profile?.displayName || "Signed in"}</p>
          <p className="truncate text-sm text-sub">{account.email}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-green">
            <ShieldCheck size={14} /> {methods.join(" · ")}
          </p>
        </div>
      </div>

      {!account.verified && account.providers.includes("password") && (
        <div className="glass flex items-start gap-3 p-4 text-sm">
          <Mail size={20} className="mt-0.5 shrink-0 text-green" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">Verify your email</p>
            <p className="text-sub">We sent a link to {account.email}. Verifying lets you reset your password safely.</p>
            <button
              onClick={() =>
                resendVerification()
                  .then(() => toast("Verification email sent", "info"))
                  .catch((err) => toast(authMessage(err), "error"))
              }
              className="mt-2 text-sm font-semibold text-green"
            >
              Resend the link
            </button>
          </div>
        </div>
      )}

      <div className="glass space-y-2 p-4 text-sm text-sub">
        <p>Your points, streak and leaderboard name are saved to this account.</p>
        <p>Scan history stays on each device.</p>
      </div>

      <Button variant="outline" size="lg" className="w-full" onClick={out} disabled={busy}>
        <LogOut size={18} /> {busy ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
