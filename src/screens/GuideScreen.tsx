import { useState } from "react"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Mark } from "@/components/ui/card"
import { categoryIcon } from "@/components/brand"
import { guide, ruleLabel, rulesForCategory } from "@/lib/guide"
import { cn } from "@/lib/utils"
import { useApp } from "@/state/AppContext"

/** Read-only view of the campus waste guide: every bin and the rules in it, exactly as in the file. */
export function GuideScreen() {
  const { navigate } = useApp()
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="px-4 pt-4 pb-32 lg:mx-auto lg:max-w-[1000px] lg:pt-8 lg:pb-16">
      <header className="mb-2 flex items-center gap-2">
        <Button variant="secondary" size="icon" aria-label="Back to Home" onClick={() => navigate({ name: "home" })}>
          <ArrowLeft size={22} />
        </Button>
        <h1 className="display text-3xl">Waste Guide</h1>
      </header>
      <p className="mb-5 text-sm text-sub">
        Every answer WasteWise gives comes from this guide. Tap an item to read its rule.
      </p>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        {guide.categories.map((c, ci) => {
          const Icon = categoryIcon(c.id)
          const rules = rulesForCategory(c.id)
          return (
            <Card key={c.id} index={ci}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: c.color }}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="display text-lg leading-tight">{c.label}</h2>
                  <p className="text-sm text-sub">{c.bin}</p>
                </div>
                <Mark className="ml-auto text-xs">{rules.length} items</Mark>
              </div>
              <ul className="space-y-2">
                {rules.map((r) => {
                  const isOpen = open === r.rule_id
                  return (
                    <li key={r.rule_id} className="tile">
                      <button
                        onClick={() => setOpen(isOpen ? null : r.rule_id)}
                        aria-expanded={isOpen}
                        className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left"
                      >
                        <span className="flex-1 text-sm font-semibold capitalize">{r.item_names[0]}</span>
                        <span className="text-xs text-sub">§{r.rule_id}</span>
                        <ChevronDown size={16} className={cn("shrink-0 text-green transition-transform", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="space-y-2 px-4 pb-4">
                          <blockquote className="border-l-4 border-green pl-3 text-sm leading-relaxed">“{r.source_text}”</blockquote>
                          {r.preparation.length > 0 && (
                            <ol className="list-decimal space-y-1 pl-9 text-sm text-sub">
                              {r.preparation.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          )}
                          <p className="text-xs text-sub">{ruleLabel(r.rule_id)}</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
