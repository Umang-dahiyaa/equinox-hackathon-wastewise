import { BrainCircuit, History, MessageCircle, Trophy, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Note, SectionTitle } from "@/components/ui/card"
import { CampusGlobe } from "@/components/campus-globe"
import { LuluMascot } from "@/components/ui/LuluMascot"
import { Logo } from "@/components/brand"
import { IdentifyCard } from "@/components/identify-card"
import { EcoTrackingCard, HistoryRow, LeaderboardPreviewCard } from "@/components/widgets"
import { uuid } from "@/lib/utils"
import { useApp } from "@/state/AppContext"

export function HomeScreen() {
  const { navigate, history, setChatOpen, toast } = useApp()
  const recent = history.slice(0, 3)

  return (
    <div className="space-y-4 px-4 pt-4 pb-28 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-6 lg:space-y-0 lg:pt-8 lg:pb-16">
      {/* 1. Header */}
      <header className="ww-fade-up flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size={38} />
          <div>
            <h1 className="display text-[22px] leading-none text-green">WasteWise</h1>
            <p className="mt-1 text-xs text-sub">Sort smarter. Waste less.</p>
          </div>
        </div>
        <button onClick={() => navigate({ name: "profile" })} className="ww-press pill-glass grid h-11 w-11 place-items-center" aria-label="Profile">
          <UserRound size={20} />
        </button>
      </header>

      {/* 2. Greeting — the Reelmark headline block */}
      <section className="ww-fade-up relative pt-3 pb-1 text-center lg:col-span-6 lg:self-center lg:pt-0 lg:pr-6 lg:text-left" style={{ animationDelay: "40ms" }}>
        <h2 className="display text-[44px] leading-[1.04] lg:text-[76px] lg:leading-[0.98]">
          Let's sort it
          <br />
          <span className="whitespace-nowrap" style={{ letterSpacing: "-0.022em" }}>
            right 🌱
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-relaxed text-sub lg:mx-0 lg:mt-5 lg:max-w-[440px] lg:text-lg">Not sure which bin to use? Let AI help you decide.</p>
        <div className="relative mt-3 flex items-center justify-center lg:mt-7 lg:justify-start">
          <span className="bg-mint grid shrink-0 aspect-square place-items-center overflow-hidden rounded-full p-1">
            <LuluMascot mood="idle" size={72} />
          </span>
          <div className="absolute top-0 right-[calc(50%+56px)] flex flex-col items-end lg:right-auto lg:left-[104px] lg:items-start">
            <Note tilt={-12} className="text-[24px]">
              Ask Lulu!
            </Note>
            <svg className="ww-draw mt-0.5 mr-[-18px] h-9 w-12 lg:mr-0 lg:ml-[-22px] lg:-scale-x-100" viewBox="0 0 48 36" aria-hidden="true">
              <path pathLength={1} d="M6 4 C10 20 22 28 40 26" fill="none" stroke="#08482D" strokeWidth={2.2} strokeLinecap="round" />
              <path pathLength={1} d="M40 26 L31 20 M40 26 L31 31" fill="none" stroke="#08482D" strokeWidth={2.2} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* 3. Identify your waste */}
      <IdentifyCard
        index={2}
        className="lg:col-span-6"
        onImage={(image) => navigate({ name: "scan", start: { key: uuid(), image } })}
        onText={(text) => navigate({ name: "scan", start: { key: uuid(), text } })}
      />

      {/* 4. Quick links */}
      <div className="ww-fade-up grid grid-cols-3 gap-3 lg:col-span-12 lg:gap-6" style={{ animationDelay: "120ms" }}>
        <QuickLink icon={<History size={20} />} label="History" onClick={() => navigate({ name: "history" })} />
        <QuickLink icon={<Trophy size={20} />} label="Leaderboard" onClick={() => navigate({ name: "leaderboard" })} />
        <QuickLink icon={<BrainCircuit size={20} />} label="Eco Quiz" note="Coming soon" onClick={() => toast("The Eco Quiz is coming soon 🧠", "info")} />
      </div>

      {/* 5. Recent scans */}
      <Card index={4} className="lg:col-span-7">
        <SectionTitle
          action={
            history.length > 0 && (
              <button onClick={() => navigate({ name: "history" })} className="ww-press pill-glass min-h-11 px-4 text-sm font-semibold">
                See all
              </button>
            )
          }
        >
          Recent scans
        </SectionTitle>
        {recent.length === 0 ? (
          <p className="tile px-4 py-6 text-center text-sm font-semibold">No scans yet — try your first one above 👆</p>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <HistoryRow key={e.id} entry={e} onClick={() => navigate({ name: "historyDetail", id: e.id })} />
            ))}
          </div>
        )}
      </Card>

      {/* 6. Chat with Lulu */}
      <Card index={5} className="flex items-center gap-4 lg:col-span-5 lg:gap-5 lg:p-7">
        <span className="bg-mint grid shrink-0 aspect-square place-items-center overflow-hidden rounded-full p-1">
          <LuluMascot mood="idle" size={64} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="display text-2xl">Chat with Lulu</h2>
          <p className="mt-0.5 text-sm text-sub">Need help? Ask Lulu anything about sorting.</p>
          <Button size="sm" className="mt-3" onClick={() => setChatOpen(true)}>
            <MessageCircle size={16} /> Start chat
          </Button>
        </div>
      </Card>

      {/* 7. Globe */}
      <section className="flex flex-col items-center pt-6 lg:col-span-4 lg:justify-center lg:pt-0">
        <div className="mint-glow w-full max-w-[360px] rounded-full">
          <CampusGlobe className="h-[300px] lg:h-[320px]" />
        </div>
        <p className="mt-3 text-sm text-sub">Sorting right, one item at a time 🌍</p>
      </section>

      {/* 8. Eco Tracking */}
      <EcoTrackingCard index={7} className="lg:col-span-4" />

      {/* 9. Leaderboard preview */}
      <LeaderboardPreviewCard index={8} className="lg:col-span-4" />
    </div>
  )
}

function QuickLink({ icon, label, note, onClick }: { icon: React.ReactNode; label: string; note?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ww-press glass lift flex min-h-[88px] flex-col items-center justify-center gap-1.5 px-2 py-3 lg:min-h-[76px] lg:flex-row lg:justify-start lg:gap-3 lg:px-5">
      <span className="pill grid h-9 w-9 place-items-center rounded-full">{icon}</span>
      <span className="text-[13px] font-semibold lg:text-[15px]">{label}</span>
      {note && <span className="-mt-1 text-[11px] text-sub lg:mt-0 lg:ml-auto lg:text-xs">{note}</span>}
    </button>
  )
}
