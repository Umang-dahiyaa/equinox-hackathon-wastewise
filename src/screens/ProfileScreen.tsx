import { useEffect, useState } from "react"
import { ArrowLeft, Award, Flame, Hash, Package, Pencil, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { LuluMascot } from "@/components/ui/LuluMascot"
import { LevelBadge } from "@/components/brand"
import { Avatar, LevelProgress, StatTile } from "@/components/widgets"
import { useMyRank } from "@/hooks/useLeaderboard"
import { useStats } from "@/hooks/useStats"
import { guide } from "@/lib/guide"
import { BADGES } from "@/lib/levels"
import { AVATARS, NICKNAME_HINT, validateNickname } from "@/lib/nickname"
import { cn } from "@/lib/utils"
import { useApp } from "@/state/AppContext"

export function ProfileScreen() {
  const { navigate, profile, openJoin, updateSettings, toast, storeMode, history } = useApp()
  const s = useStats()
  const weeklyRank = useMyRank("week")
  const [editing, setEditing] = useState(false)

  const maxCat = Math.max(1, ...Object.values(s.byCategory))
  const cats = [...guide.categories.map((c) => ({ id: c.id, label: c.label, color: c.color })), { id: "none", label: "Not in guide", color: "#5B6770" }]

  return (
    <div className="space-y-4 px-4 pt-4 pb-32 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0 lg:pt-8 lg:pb-16">
      <header className="flex items-center gap-2 lg:col-span-2">
        <Button variant="secondary" size="icon" aria-label="Back to Home" onClick={() => navigate({ name: "home" })}>
          <ArrowLeft size={22} />
        </Button>
        <h1 className="display text-3xl">Profile</h1>
      </header>

      <Card index={0}>
        <div className="flex items-center gap-4">
          {profile ? (
            <Avatar emoji={profile.avatar} size={64} />
          ) : (
            <span className="bg-mint grid shrink-0 aspect-square place-items-center overflow-hidden rounded-full p-1">
              <LuluMascot mood="idle" size={56} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className={cn("display leading-tight", profile ? "truncate text-3xl" : "text-2xl")}>{profile?.displayName ?? "Not on the leaderboard yet"}</h2>
            <LevelBadge points={s.points} className="mt-1" />
          </div>
          {profile && (
            <Button variant="secondary" size="icon" aria-label="Edit nickname and avatar" onClick={() => setEditing(true)}>
              <Pencil size={18} />
            </Button>
          )}
        </div>
        <div className="mt-4">
          <LevelProgress compact />
        </div>
        {!profile && (
          <Button className="mt-4 w-full" onClick={openJoin}>
            Pick a nickname
          </Button>
        )}
      </Card>

      <Card index={1}>
        <h2 className="display mb-3 text-lg">Your stats</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<Star size={16} />} value={s.points} label="All-time points" />
          <StatTile icon={<Hash size={16} />} value={weeklyRank ? `#${weeklyRank}` : "—"} label="Weekly rank" />
          <StatTile icon={<Flame size={16} />} value={s.streak} label="Day streak" />
          <StatTile icon={<Package size={16} />} value={s.totalSorted} label="Items sorted" />
          <StatTile icon={<Pencil size={16} />} value={s.corrections} label="Corrections" />
          <StatTile icon={<Award size={16} />} value={profile ? BADGES.filter((b) => b.earned(profile)).length : 0} label="Badges" />
        </div>
        {storeMode === "local" && <p className="mt-3 text-xs text-sub">Weekly rank appears once the campus leaderboard is connected.</p>}
      </Card>

      <Card index={2}>
        <h2 className="display mb-3 text-lg">What you've sorted</h2>
        {history.length === 0 ? (
          <p className="text-sm text-sub">Scan your first item to see your category breakdown.</p>
        ) : (
          <div className="space-y-2.5">
            {cats.map((c) => {
              const n = s.byCategory[c.id] ?? 0
              return (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold">{c.label}</span>
                    <span className="text-sub">{n}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-mint">
                    <div className="h-full rounded-full border border-green/12" style={{ width: `${(n / maxCat) * 100}%`, background: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card index={3}>
        <h2 className="display mb-3 text-lg">Badges</h2>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const earned = !!profile && b.earned(profile)
            return (
              <div key={b.id} className={cn("rounded-[16px] px-3 py-3", earned ? "pill rounded-[16px]" : "tile opacity-60")}>
                <div className="text-2xl" aria-hidden="true">{b.emoji}</div>
                <div className="mt-1 text-sm font-semibold">{b.name}</div>
                <div className={cn("text-[11px]", earned ? "text-white/75" : "text-sub")}>{earned ? "Earned" : b.description}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {profile && (
        <Card index={4} className="lg:col-span-2">
          <h2 className="display mb-3 text-lg">Settings</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Show me on the public leaderboard</p>
              <p className="text-xs text-sub">Hidden users still earn points and see their own rank.</p>
            </div>
            <Switch
              label="Show me on the public leaderboard"
              checked={profile.showOnLeaderboard}
              onChange={(v) => updateSettings({ showOnLeaderboard: v }).catch(() => toast("Couldn't save that setting.", "error"))}
            />
          </div>
          <Button variant="outline" className="mt-4 w-full" onClick={() => setEditing(true)}>
            Change nickname or avatar
          </Button>
        </Card>
      )}

      {profile && editing && (
        <EditProfileCard
          name={profile.displayName}
          avatar={profile.avatar}
          onCancel={() => setEditing(false)}
          onSave={async (name, avatar) => {
            await updateSettings({ displayName: name, avatar })
            setEditing(false)
            toast("Profile updated 🌱", "info")
          }}
        />
      )}
    </div>
  )
}

function EditProfileCard({ name, avatar, onSave, onCancel }: { name: string; avatar: string; onSave: (n: string, a: string) => Promise<void>; onCancel: () => void }) {
  const [n, setN] = useState(name)
  const [a, setA] = useState(avatar)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => setErr(null), [n])
  return (
    <div className="fixed inset-0 z-50 grid place-items-end lg:place-items-center">
      <div className="ww-fade absolute inset-0 bg-ink/30" onClick={onCancel} aria-hidden="true" />
      <form
        className="sky-sheet ww-sheet relative mx-auto w-full max-w-[480px] space-y-4 rounded-t-[28px] px-5 pt-5 pb-8 lg:max-w-[540px] lg:rounded-[28px] lg:p-7"
        onSubmit={async (e) => {
          e.preventDefault()
          const v = validateNickname(n)
          if (v) return setErr(v)
          setBusy(true)
          try {
            await onSave(n, a)
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : "Couldn't save. Try again.")
          } finally {
            setBusy(false)
          }
        }}
      >
        <h2 className="display text-3xl">Edit profile</h2>
        <NicknameFields name={n} setName={setN} avatar={a} setAvatar={setA} error={err} />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={busy}>Save</Button>
        </div>
      </form>
    </div>
  )
}

export function NicknameFields({ name, setName, avatar, setAvatar, error }: { name: string; setName: (v: string) => void; avatar: string; setAvatar: (v: string) => void; error: string | null }) {
  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Nickname</span>
        <input
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. GreenMadhav"
          className="field h-12 w-full px-5 text-[15px]"
          aria-describedby="nickname-hint"
        />
        <span id="nickname-hint" className={cn("mt-1.5 block text-xs", error ? "font-semibold text-green" : "text-sub")}>
          {error ?? NICKNAME_HINT}
        </span>
      </label>
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Avatar</span>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setAvatar(e)}
              aria-label={`Avatar ${e}`}
              aria-pressed={avatar === e}
              className={cn("ww-press grid h-12 w-12 place-items-center rounded-full bg-white text-2xl shadow-soft", avatar === e && "ring-4 ring-green")}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
