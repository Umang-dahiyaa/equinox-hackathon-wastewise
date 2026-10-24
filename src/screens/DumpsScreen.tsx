// Dumps: citizen reports of illegal roadside dumps, the sweeper density heatmap,
// government dispatch and the sweeper queue. Built by Kunwar Juneja as a separate
// app on the main branch; this screen hosts it inside WasteWise.

import { useCallback, useEffect, useState } from "react"
import { Camera, Map as MapIcon, ScanLine, Send, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GovernmentRegistry } from "@/dumps/GovernmentRegistry"
import { GovernmentReportModal } from "@/dumps/GovernmentReportModal"
import { HeatmapView } from "@/dumps/HeatmapView"
import { SnapReportModal } from "@/dumps/SnapReportModal"
import { SweeperQueue } from "@/dumps/SweeperQueue"
import type { DumpReport, DumpStatus } from "@/dumps/types"
import { cn } from "@/lib/utils"
import { useApp } from "@/state/AppContext"

type Tab = "heatmap" | "government" | "sweeper"

const TABS: { id: Tab; label: string; icon: typeof MapIcon }[] = [
  { id: "heatmap", label: "Heatmap", icon: MapIcon },
  { id: "government", label: "Gov dispatch", icon: Send },
  { id: "sweeper", label: "Sweeper queue", icon: Truck },
]

export function DumpsScreen() {
  const { toast, navigate } = useApp()
  const [tab, setTab] = useState<Tab>("heatmap")
  const [dumps, setDumps] = useState<DumpReport[]>([])
  const [loading, setLoading] = useState(true)
  const [snapOpen, setSnapOpen] = useState(false)
  const [govOpen, setGovOpen] = useState(false)
  const [govDump, setGovDump] = useState<DumpReport | null>(null)

  const fetchDumps = useCallback(async () => {
    try {
      const res = await fetch("/api/dumps")
      const data = await res.json()
      if (data.success && data.dumps) setDumps(data.dumps)
    } catch (err) {
      console.error("Error fetching dumps:", err)
      toast("Couldn't load dump reports. Check the server is running.", "error")
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchDumps()
  }, [fetchDumps])

  const openGov = (dump: DumpReport) => {
    setGovDump(dump)
    setGovOpen(true)
  }

  const onReportCreated = (dump: DumpReport, dispatchNow = false) => {
    setDumps((prev) => [dump, ...prev])
    toast(`"${dump.title}" reported and added to the heatmap`, "happy")
    if (dispatchNow) openGov(dump)
  }

  const onGovSuccess = (updated: DumpReport) => {
    setDumps((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    toast(`Ticket #${updated.governmentDispatch?.ticketNumber} sent to the municipal body`, "happy")
  }

  const updateStatus = async (id: string, status: DumpStatus, assignedTeam?: string, sweeperNotes?: string, afterImageUrl?: string, recycledKg?: number) => {
    try {
      const res = await fetch(`/api/dumps/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedTeam, sweeperNotes, afterImageUrl, recycledKg }),
      })
      const data = await res.json()
      if (data.success && data.dump) {
        setDumps((prev) => prev.map((d) => (d.id === id ? data.dump : d)))
        toast(`Marked as ${status.replace(/_/g, " ")}`, "info")
      }
    } catch (err) {
      console.error("Failed to update status:", err)
      toast("Couldn't update the sweeper status.", "error")
    }
  }

  const active = dumps.filter((d) => d.status !== "cleaned").length

  return (
    <div className="space-y-4 px-4 pt-4 pb-32 lg:pt-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-green uppercase">Community cleanup</p>
          <h1 className="display text-3xl lg:text-[40px]">Illegal dumps</h1>
          <p className="mt-0.5 text-sm text-sub">
            Report roadside dumps, see hotspots and track cleanup.
            {!loading && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-[#FFE9E6] px-2 py-0.5 text-xs font-bold text-[#C0261B]">{active} active</span>
            )}
          </p>
        </div>
        <Button onClick={() => setSnapOpen(true)}>
          <Camera size={18} /> Report a dump
        </Button>
      </header>

      <div role="tablist" aria-label="Dumps views" className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("ww-press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold", tab === id ? "pill" : "pill-glass text-green")}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass grid place-items-center p-12 text-sm text-sub">Loading dump reports…</div>
      ) : (
        <>
          {tab === "heatmap" && (
            <div className="glass h-[780px] overflow-hidden p-0 lg:h-[calc(100dvh-16rem)] lg:min-h-[580px]">
              <HeatmapView
                dumps={dumps}
                onSelectDump={(d) => setGovDump(d)}
                onOpenGovernmentModal={openGov}
                onOpenSnapModal={() => setSnapOpen(true)}
                onUpdateStatus={updateStatus}
                onRefreshDumps={fetchDumps}
              />
            </div>
          )}
          {tab === "government" && <GovernmentRegistry dumps={dumps} onOpenGovernmentModal={openGov} onOpenSnapModal={() => setSnapOpen(true)} />}
          {tab === "sweeper" && <SweeperQueue dumps={dumps} onUpdateStatus={updateStatus} onOpenGovernmentModal={openGov} />}
        </>
      )}

      <button onClick={() => navigate({ name: "scan" })} className="ww-press glass flex w-full items-center gap-3 p-4 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-green">
          <ScanLine size={20} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-ink">Sorting a single item?</span>
          <span className="block text-sm text-sub">Scan it to see which campus bin it goes in.</span>
        </span>
      </button>

      <SnapReportModal isOpen={snapOpen} onClose={() => setSnapOpen(false)} onReportCreated={onReportCreated} />
      <GovernmentReportModal
        dump={govDump}
        isOpen={govOpen}
        onClose={() => {
          setGovOpen(false)
          setGovDump(null)
        }}
        onReportSuccess={onGovSuccess}
      />
    </div>
  )
}
