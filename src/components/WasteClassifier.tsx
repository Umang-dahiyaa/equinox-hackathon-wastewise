import React, { useState } from 'react';
import {
  Sparkles,
  Recycle,
  Leaf,
  AlertOctagon,
  Trash,
  Upload,
  Camera,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface WasteItem {
  name: string;
  category: 'recyclable' | 'compost' | 'hazardous' | 'landfill' | 'ewaste';
  binColor: string;
  binName: string;
  instructions: string;
  decompositionTime: string;
  co2SavedGrams: number;
}

const SAMPLE_DATABASE: Record<string, WasteItem> = {
  'plastic bottle': {
    name: 'PET Plastic Water Bottle',
    category: 'recyclable',
    binColor: 'bg-blue-600 text-white',
    binName: 'Blue Recycling Bin',
    instructions: 'Empty residual liquids, crush bottle flat to save volume, replace cap.',
    decompositionTime: '450 years',
    co2SavedGrams: 82,
  },
  'banana peel': {
    name: 'Banana Peel / Organic Scrap',
    category: 'compost',
    binColor: 'bg-emerald-600 text-white',
    binName: 'Green Wet Compost Bin',
    instructions: 'Compost directly in household vermicompost or municipal organic bin. No plastic bags.',
    decompositionTime: '2 to 5 weeks',
    co2SavedGrams: 45,
  },
  'lithium battery': {
    name: 'Lithium-Ion / Alkaline Battery',
    category: 'hazardous',
    binColor: 'bg-red-600 text-white',
    binName: 'Red Hazardous Waste Depository',
    instructions: 'Do not throw in general trash! Tape terminal ends with electrical tape and drop at battery collection kiosk.',
    decompositionTime: '100+ years (toxic heavy metal risk)',
    co2SavedGrams: 350,
  },
  'cardboard box': {
    name: 'Corrugated Shipping Box',
    category: 'recyclable',
    binColor: 'bg-blue-600 text-white',
    binName: 'Blue Recycling Bin',
    instructions: 'Flatten all boxes, remove excess plastic tape, keep dry.',
    decompositionTime: '2 months',
    co2SavedGrams: 210,
  },
  'styrofoam container': {
    name: 'Expanded Polystyrene Food Clamshell',
    category: 'landfill',
    binColor: 'bg-slate-700 text-white',
    binName: 'Black Landfill Bin',
    instructions: 'Cannot be recycled in standard curbside programs due to food contamination. Dispose in landfill bin or seek specialized densifier dropoff.',
    decompositionTime: '500+ years',
    co2SavedGrams: 0,
  },
  'broken smartphone': {
    name: 'Mobile Phone / Printed Circuit Board',
    category: 'ewaste',
    binColor: 'bg-purple-600 text-white',
    binName: 'Purple E-Waste Collection',
    instructions: 'Wipe personal data. Hand over to certified WEEE / authorized municipal e-waste recycler to recover gold and copper.',
    decompositionTime: '1,000+ years',
    co2SavedGrams: 850,
  },
};

export const WasteClassifier: React.FC<{ onOpenSnapModal: () => void }> = ({ onOpenSnapModal }) => {
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<WasteItem>(SAMPLE_DATABASE['plastic bottle']);
  const [analyzing, setAnalyzing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      const lower = query.toLowerCase();
      // Match sample database
      const foundKey = Object.keys(SAMPLE_DATABASE).find((k) => lower.includes(k) || k.includes(lower));

      if (foundKey) {
        setSelectedItem(SAMPLE_DATABASE[foundKey]);
      } else {
        // Generic smart classification
        const isOrganic = /apple|food|bread|leaf|vegetable|fruit|meat|coffee|tea/.test(lower);
        const isHazard = /chemical|battery|paint|bulb|motor|medicine|oil/.test(lower);
        const isRecycle = /paper|glass|can|metal|aluminum|bottle|box|plastic/.test(lower);

        if (isOrganic) {
          setSelectedItem({
            name: query,
            category: 'compost',
            binColor: 'bg-emerald-600 text-white',
            binName: 'Green Compost Bin',
            instructions: 'Biodegradable organic matter. Direct to composting bin to avoid methane production.',
            decompositionTime: '1 to 3 months',
            co2SavedGrams: 60,
          });
        } else if (isHazard) {
          setSelectedItem({
            name: query,
            category: 'hazardous',
            binColor: 'bg-red-600 text-white',
            binName: 'Red Hazardous Waste Depository',
            instructions: 'Contains potential environmental toxins. Deliver to municipal household hazardous waste site.',
            decompositionTime: '50+ years',
            co2SavedGrams: 400,
          });
        } else if (isRecycle) {
          setSelectedItem({
            name: query,
            category: 'recyclable',
            binColor: 'bg-blue-600 text-white',
            binName: 'Blue Recycling Bin',
            instructions: 'Rinse cleanly, remove contaminants, place in curbside recycling cart.',
            decompositionTime: 'Decades to centuries',
            co2SavedGrams: 150,
          });
        } else {
          setSelectedItem({
            name: query,
            category: 'landfill',
            binColor: 'bg-slate-700 text-white',
            binName: 'Black General Landfill Bin',
            instructions: 'Non-recyclable composite material. Ensure bag is sealed tightly.',
            decompositionTime: 'Indefinite',
            co2SavedGrams: 0,
          });
        }
      }
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> AI Waste Segregation Engine
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Smart Waste Sorter & Disposal Guide
        </h1>
        <p className="text-sm text-slate-500">
          Search any household or roadside item to get exact bin segregation rules, municipal recycling protocols, and carbon savings.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type item name (e.g. coffee cup, lithium battery, cardboard box, milk carton)..."
            className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-24"
          />
          <button
            type="submit"
            disabled={analyzing}
            className="absolute right-2 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            {analyzing ? 'Checking...' : 'Classify'}
          </button>
        </div>
      </form>

      {/* Quick Tag Pills for instant testing */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Quick examples:</span>
        {Object.keys(SAMPLE_DATABASE).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedItem(SAMPLE_DATABASE[key])}
            className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium capitalize transition-colors"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Result Card */}
      {selectedItem && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Classified Item
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {selectedItem.name}
              </h2>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold shadow-xs ${selectedItem.binColor}`}>
              {selectedItem.binName}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Proper Segregation Protocol
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedItem.instructions}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 block font-medium">Decomposition Lifespan</span>
              <span className="text-base font-bold font-mono text-slate-800 mt-0.5 block">
                {selectedItem.decompositionTime}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
              <span className="text-emerald-700 block font-medium">CO₂ Emissions Offset</span>
              <span className="text-base font-bold font-mono text-emerald-800 mt-0.5 block">
                +{selectedItem.co2SavedGrams} g CO₂e
              </span>
            </div>
          </div>

          {/* Roadside dump callout */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Spotted illegal roadside dumping of this material in your neighborhood?
            </div>
            <button
              onClick={onOpenSnapModal}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shrink-0 transition-colors"
            >
              Snap & Report Dump
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
