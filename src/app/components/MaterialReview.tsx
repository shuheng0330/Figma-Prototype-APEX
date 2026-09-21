import { useState, useRef } from "react";
import {
  CheckCircle, XCircle, FileText, Sparkles,
  AlignLeft, List as ListIcon, Table2, AlertTriangle,
  Image as ImgIcon, Video, Play, Plus, Eye, Pencil, Upload,
  GripVertical, X, Lock,
} from "lucide-react";
import { MODULE_BLOCKS, MODULE_META, moduleStatus as storeModuleStatus, updateModuleStatus } from "../courseStore";
import { useRole, ROLE_META, scopeOf } from "../access";
import { ROLE_IDENTITY, sopOwner, staffById, useStoreVersion } from "../trainingStore";


const TEAL = "#00C9A7";

// ── Types ─────────────────────────────────────────────────────────────────────
type MStatus = "approved" | "pending" | "rejected";
type BType = "paragraph" | "steps" | "table" | "warning" | "image" | "video";

interface SopDoc   { id: string; title: string; dept: string; date: string; emoji: string; }
interface Module   { id: string; sopId: string; number: number; title: string; initStatus: MStatus; }
interface Block    { id: string; type: BType; data: Record<string, any>; }
interface KeyTerm  { term: string; def: string; }

// ── Static data ───────────────────────────────────────────────────────────────
const SOPS: SopDoc[] = [
  { id: "s1", title: "AC Installation Manual",     dept: "Engineering", date: "16 May 2026", emoji: "🔧" },
  { id: "s2", title: "Customer Service Protocol",  dept: "Sales",       date: "17 May 2026", emoji: "🤝" },
  { id: "s3", title: "Data Privacy Guidelines v2", dept: "IT",          date: "18 May 2026", emoji: "🔒" },
];

const ALL_MODULES: Module[] = [
  { id: "m1",  sopId: "s1", number: 1, title: "R32 Refrigerant Safety"         , initStatus: "approved" },
  { id: "m2",  sopId: "s1", number: 2, title: "Site Selection & Mounting"       , initStatus: "approved" },
  { id: "m3",  sopId: "s1", number: 3, title: "Piping Connection & Air Purging" , initStatus: "pending"  },
  { id: "m4",  sopId: "s1", number: 4, title: "Electrical Wiring & Cable Specs" , initStatus: "pending"  },
  { id: "m5",  sopId: "s1", number: 5, title: "Maintenance & Troubleshooting"   , initStatus: "rejected" },
  { id: "m6",  sopId: "s1", number: 6, title: "Remote Control Operations"       , initStatus: "approved" },
  { id: "m7",  sopId: "s1", number: 7, title: "Warranty & Documentation"        , initStatus: "approved" },
  { id: "m8",  sopId: "s2", number: 1, title: "Customer Communication Skills"   , initStatus: "approved" },
  { id: "m9",  sopId: "s2", number: 2, title: "Complaint Handling Procedure"    , initStatus: "pending"  },
  { id: "m10", sopId: "s2", number: 3, title: "Customer Handover Protocol"      , initStatus: "approved" },
  { id: "m11", sopId: "s3", number: 1, title: "Data Classification Framework"   , initStatus: "approved" },
  { id: "m12", sopId: "s3", number: 2, title: "Encryption & Access Control"     , initStatus: "pending"  },
];

const STATUS: Record<MStatus, { color: string; bg: string; label: string }> = {
  approved: { color: "#059669", bg: "#ECFDF5", label: "Approved" },
  pending:  { color: "#D97706", bg: "#FEF3C7", label: "Pending"  },
  rejected: { color: "#DC2626", bg: "#FEE2E2", label: "Rejected" },
};

const INIT_OBJECTIVES = [
  "Identify correct torque values by pipe size and model",
  "Connect indoor and outdoor unit pipes without deformation",
  "Wrap and insulate all pipe joints and drain hose correctly",
  "Perform the full vacuum pump air purging sequence safely",
];

const INIT_TOOLS = [
  "Torque Wrench", "Vacuum Pump", "Manifold Gauge",
  "Electronic Leak Detector", "Vinyl Tape", "Two Open-End Wrenches",
];

const INIT_BLOCKS: Block[] = [
  {
    id: "b1", type: "paragraph",
    data: { text: "This module covers the correct procedures for connecting refrigerant pipes, applying torque to flare nuts, wrapping thermal insulation, and purging air using a vacuum pump. All R32 refrigerant connections must be completed on the outdoor side only." },
  },
  {
    id: "b2", type: "table",
    data: {
      headers: ["Pipe Side", "Pipe Size", "Torque (N·m)", "Nut Width"],
      rows: [
        ["Liquid", "φ6mm (¼\")",    "15 – 20", "17mm"],
        ["Gas",    "φ9.53mm (⅜\")", "30 – 35", "22mm"],
        ["Gas",    "φ12mm (½\")",   "30 – 35", "24mm"],
        ["Gas",    "φ16mm (⅝\")",   "50 – 55", "27mm"],
      ],
    },
  },
  {
    id: "b3", type: "warning",
    data: { text: "Never use compressed air or oxygen to flush the refrigerant circuit. Only Oxygen Free Nitrogen (OFN) is permitted for purging. R32 refrigerant is flammable — any ignition source creates a serious fire and explosion hazard.", level: "danger" },
  },
];

const INIT_KEY_TERMS: KeyTerm[] = [
  { term: "Flare Nut",      def: "Threaded nut connecting refrigerant pipes to the valve; always pre-tighten by hand before using a wrench." },
  { term: "Torque (N·m)",   def: "Rotational force during tightening — incorrect torque deforms the pipe and causes refrigerant leaks." },
  { term: "100Pa Absolute", def: "Target vacuum level confirming the system is fully airtight before opening any refrigerant valves." },
  { term: "Vacuum Pump",    def: "Removes air and moisture from the refrigerant circuit prior to refrigerant introduction." },
];

const BLOCK_TYPES: Array<{ type: BType; icon: React.ElementType; label: string }> = [
  { type: "paragraph", icon: AlignLeft,     label: "Paragraph" },
  { type: "steps",     icon: ListIcon,      label: "Steps"     },
  { type: "table",     icon: Table2,        label: "Table"     },
  { type: "warning",   icon: AlertTriangle, label: "Warning"   },
  { type: "image",     icon: ImgIcon,       label: "Image"     },
  { type: "video",     icon: Video,         label: "Video"     },
];

// ── Block renderers ───────────────────────────────────────────────────────────
function BlockShell({
  type, icon: Icon, label, children, mode, onDelete,
}: {
  type: BType; icon: React.ElementType; label: string; children: React.ReactNode;
  mode?: "edit" | "preview"; onDelete?: () => void;
}) {
  const accent: Record<BType, { border: string; hdr: string; icon: string }> = {
    paragraph: { border: "#E5E7EB", hdr: "#F9FAFB", icon: "#9CA3AF" },
    steps:     { border: "#E5E7EB", hdr: "#F9FAFB", icon: "#9CA3AF" },
    table:     { border: "#E5E7EB", hdr: "#F9FAFB", icon: "#9CA3AF" },
    warning:   { border: "#FECACA", hdr: "#FEF2F2", icon: "#EF4444" },
    image:     { border: "#A7F3D0", hdr: "#ECFDF5", icon: TEAL      },
    video:     { border: "#C7D2FE", hdr: "#EEF2FF", icon: "#6366F1" },
  };
  const a = accent[type];
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${a.border}` }}>
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ backgroundColor: a.hdr, borderBottom: `1px solid ${a.border}`, cursor: mode === "edit" ? "grab" : "default" }}
      >
        {mode === "edit" && <GripVertical size={13} className="shrink-0" style={{ color: "#D1D5DB" }} />}
        <Icon size={13} style={{ color: a.icon }} />
        <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: a.icon }}>{label}</span>
        {mode === "edit" && onDelete && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-red-100"
            title="Remove block"
          >
            <X size={11} style={{ color: "#9CA3AF" }} className="hover:text-red-500" />
          </button>
        )}
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function ParagraphBlock({ data, mode, onChange, onDelete }: { data: Record<string, any>; mode: "edit" | "preview"; onChange: (d: Record<string, any>) => void; onDelete?: () => void }) {
  return (
    <BlockShell type="paragraph" icon={AlignLeft} label="Paragraph" mode={mode} onDelete={onDelete}>
      <div className="p-4">
        {mode === "edit" ? (
          <textarea
            value={data.text}
            onChange={e => onChange({ ...data, text: e.target.value })}
            rows={4}
            className="w-full text-[13px] text-[#374151] leading-relaxed focus:outline-none resize-none"
            style={{ border: "none", background: "transparent" }}
          />
        ) : (
          <p className="text-[13px] text-[#374151] leading-relaxed">{data.text}</p>
        )}
      </div>
    </BlockShell>
  );
}

function TableBlock({ data, mode, onDelete }: { data: Record<string, any>; mode: "edit" | "preview"; onDelete?: () => void }) {
  return (
    <BlockShell type="table" icon={Table2} label="Table" mode={mode} onDelete={onDelete}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ backgroundColor: TEAL }}>
              {(data.headers as string[]).map((h: string, i: number) => (
                <th key={i} className="px-4 py-2.5 text-left text-[10px] font-bold text-white uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.rows as string[][]).map((row: string[], i: number) => (
              <tr key={i} className="border-b border-gray-50" style={{ backgroundColor: i % 2 === 0 ? "white" : "#F9FAFB" }}>
                {row.map((cell: string, j: number) => (
                  <td key={j} className="px-4 py-2.5 text-[#374151]" style={j === 0 ? { fontWeight: 600, color: "#1A1F2E" } : {}}>
                    {mode === "edit" ? (
                      <span className="text-[12px]">{cell}</span>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BlockShell>
  );
}

function WarningBlock({ data, mode, onChange, onDelete }: { data: Record<string, any>; mode: "edit" | "preview"; onChange: (d: Record<string, any>) => void; onDelete?: () => void }) {
  return (
    <BlockShell type="warning" icon={AlertTriangle} label="Warning" mode={mode} onDelete={onDelete}>
      <div className="p-4" style={{ backgroundColor: "#FEF2F2" }}>
        <div className="flex gap-3">
          <span className="text-lg shrink-0">⛔</span>
          {mode === "edit" ? (
            <textarea
              value={data.text}
              onChange={e => onChange({ ...data, text: e.target.value })}
              rows={3}
              className="flex-1 text-[13px] text-[#991B1B] leading-relaxed focus:outline-none resize-none bg-transparent"
            />
          ) : (
            <p className="text-[13px] text-[#991B1B] leading-relaxed">{data.text}</p>
          )}
        </div>
      </div>
    </BlockShell>
  );
}

function ImageBlock({ data, mode, onChange, onDelete }: { data: Record<string, any>; mode: "edit" | "preview"; onChange: (d: Record<string, any>) => void; onDelete?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ ...data, src: ev.target?.result as string, filename: file.name });
    reader.readAsDataURL(file);
  };

  return (
    <BlockShell type="image" icon={ImgIcon} label="Image" mode={mode} onDelete={onDelete}>
      {data.src ? (
        <>
          <img src={data.src} alt={data.caption || "Uploaded image"} className="w-full object-contain" style={{ maxHeight: 320, backgroundColor: "#F9FAFB" }} />
          {mode === "edit" && (
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-[#9CA3AF] truncate max-w-[60%]">{data.filename || "image"}</span>
              <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280] hover:text-[#1A1F2E]">
                <Upload size={11} /> Replace
              </button>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-6 bg-gray-50">
          <div className="w-14 h-14 rounded-xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-3">
            <ImgIcon size={22} className="text-gray-300" />
          </div>
          <p className="text-[12px] text-[#9CA3AF] mb-3">No image selected</p>
          {mode === "edit" && (
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white cursor-pointer" style={{ backgroundColor: TEAL }}>
              <Upload size={12} /> Upload from Device
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      )}
      {/* Caption */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Caption</p>
        {mode === "edit" ? (
          <input
            type="text"
            value={data.caption ?? ""}
            onChange={e => onChange({ ...data, caption: e.target.value })}
            className="w-full text-[12px] text-[#6B7280] focus:outline-none border-b border-gray-200 focus:border-[#00C9A7] pb-1 bg-transparent transition-colors"
            placeholder="Describe this image…"
          />
        ) : (
          data.caption && <p className="text-[12px] text-[#6B7280] italic">{data.caption}</p>
        )}
      </div>
    </BlockShell>
  );
}

function VideoBlock({ data, mode, onChange, onDelete }: { data: Record<string, any>; mode: "edit" | "preview"; onChange: (d: Record<string, any>) => void; onDelete?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localSrc = URL.createObjectURL(file);
    onChange({ ...data, localSrc, url: "", title: data.title || file.name.replace(/\.[^.]+$/, "") });
  };

  const hasSource = data.localSrc || data.url;

  return (
    <BlockShell type="video" icon={Video} label="Video" mode={mode} onDelete={onDelete}>
      {data.localSrc ? (
        /* Native video player for local file */
        <div className="bg-black">
          <video
            src={data.localSrc}
            controls
            className="w-full"
            style={{ maxHeight: 320 }}
          />
        </div>
      ) : hasSource ? (
        /* URL placeholder player */
        <div
          className="relative flex items-center justify-center"
          style={{ aspectRatio: "16/9", backgroundColor: "#0F172A" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.25)" }}
          >
            <Play size={22} className="text-white ml-1" fill="currentColor" />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
          >
            <p className="text-[12px] text-white font-semibold truncate">{data.title || "Untitled video"}</p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-10 px-6 bg-gray-50">
          <div className="w-14 h-14 rounded-xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-3">
            <Video size={22} className="text-gray-300" />
          </div>
          <p className="text-[12px] text-[#9CA3AF] mb-3">No video added yet</p>
          {mode === "edit" && (
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white cursor-pointer" style={{ backgroundColor: "#6366F1" }}>
              <Upload size={12} /> Upload from Device
              <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      )}

      {mode === "edit" && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-2.5">
          {/* Local file controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-[#6B7280] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
            >
              <Upload size={11} /> {data.localSrc ? "Replace File" : "Upload File"}
            </button>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
            <span className="text-[10px] text-[#9CA3AF]">or paste a URL below</span>
          </div>
          {/* URL input */}
          <input
            type="text"
            value={data.url ?? ""}
            onChange={e => onChange({ ...data, url: e.target.value, localSrc: "" })}
            className="w-full text-[12px] text-[#1A1F2E] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#6366F1] transition-colors"
            placeholder="https://youtube.com/watch?v=…"
          />
          {/* Title */}
          <input
            type="text"
            value={data.title ?? ""}
            onChange={e => onChange({ ...data, title: e.target.value })}
            className="w-full text-[12px] text-[#1A1F2E] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#6366F1] transition-colors"
            placeholder="Video title…"
          />
        </div>
      )}
    </BlockShell>
  );
}

function StepsBlock({ data, mode, onDelete }: { data: Record<string, any>; mode: "edit" | "preview"; onDelete?: () => void }) {
  const rawItems: Array<string | { title: string; body?: string }> = data.items ?? [];
  // Normalise: accept both plain strings (from courseStore) and {title,body} objects
  const items = rawItems.map(item =>
    typeof item === "string" ? { title: item, body: "" } : item
  );
  return (
    <BlockShell type="steps" icon={ListIcon} label="Steps" mode={mode} onDelete={onDelete}>
      <div className="p-4 space-y-2.5">
        {items.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: TEAL }}>{i + 1}</div>
            <div>
              <p className="text-[13px] font-semibold text-[#1A1F2E] leading-snug">{step.title}</p>
              {step.body && <p className="text-[12px] text-[#6B7280] leading-relaxed mt-0.5">{step.body}</p>}
            </div>
          </div>
        ))}
        {mode === "edit" && (
          <button className="flex items-center gap-1.5 text-[11px] font-semibold mt-1" style={{ color: TEAL }}>
            <Plus size={12} /> Add Step
          </button>
        )}
      </div>
    </BlockShell>
  );
}

// ── Document-style block renderer (preview / reading mode) ───────────────────
function DocBlock({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>;

  if (block.type === "paragraph") {
    return <p className="text-[14px] text-[#374151] leading-relaxed">{String(d.text ?? "")}</p>;
  }

  if (block.type === "table") {
    const headers = d.headers as string[];
    const rows = d.rows as string[][];
    return (
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #E5E7EB" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ backgroundColor: TEAL }}>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-[11px] font-bold text-white uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#F9FAFB" }}>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5" style={{ color: j === 0 ? "#1A1F2E" : "#374151", fontWeight: j === 0 ? 600 : 400, borderBottom: "1px solid #F3F4F6" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "warning") {
    return (
      <div className="rounded-lg p-4 flex gap-3 items-start" style={{ backgroundColor: "#FEF2F2", borderLeft: "4px solid #EF4444" }}>
        <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
        <p className="text-[13px] leading-relaxed" style={{ color: "#991B1B" }}>{String(d.text ?? "")}</p>
      </div>
    );
  }

  if (block.type === "steps") {
    const rawItems = d.items as Array<string | { title: string; body?: string }>;
    const items = rawItems.map(item => typeof item === "string" ? { title: item, body: "" } : item);
    return (
      <div className="space-y-4">
        {items.map((step, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ backgroundColor: TEAL, marginTop: 1 }}
            >
              {i + 1}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-[14px] text-[#1A1F2E] leading-relaxed">{step.title}</p>
              {step.body && <p className="text-[12px] text-[#6B7280] leading-relaxed mt-1">{step.body}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function renderBlock(
  block: Block,
  mode: "edit" | "preview",
  onChange: (id: string, data: Record<string, any>) => void,
  onDelete?: () => void,
) {
  const upd = (d: Record<string, any>) => onChange(block.id, d);
  switch (block.type) {
    case "paragraph": return <ParagraphBlock key={block.id} data={block.data} mode={mode} onChange={upd} onDelete={onDelete} />;
    case "table":     return <TableBlock     key={block.id} data={block.data} mode={mode} onDelete={onDelete} />;
    case "warning":   return <WarningBlock   key={block.id} data={block.data} mode={mode} onChange={upd} onDelete={onDelete} />;
    case "image":     return <ImageBlock     key={block.id} data={block.data} mode={mode} onChange={upd} onDelete={onDelete} />;
    case "video":     return <VideoBlock     key={block.id} data={block.data} mode={mode} onChange={upd} onDelete={onDelete} />;
    case "steps":     return <StepsBlock     key={block.id} data={block.data} mode={mode} onDelete={onDelete} />;
    default:          return null;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MaterialReview() {
  const role = useRole();
  useStoreVersion();
  const myId = ROLE_IDENTITY[role] ?? "E001";
  /** Trainers may open any approved material but edit only their own. */
  const ownOnly = scopeOf(role, "materials") === "own";

  const [selectedSop, setSelectedSop]       = useState("s1");
  const [selectedMod, setSelectedMod]       = useState("m1");
  const [mode, setMode]                     = useState<"edit" | "preview">("edit");
  const [statuses, setStatuses]             = useState<Record<string, MStatus>>(
    () => Object.fromEntries(ALL_MODULES.map(m => [m.id, storeModuleStatus[m.id] ?? m.initStatus]))
  );
  const [modTitle, setModTitle]             = useState(ALL_MODULES.find(m => m.id === "m1")?.title ?? "");
  const [summary, setSummary]               = useState(MODULE_META["m1"]?.summary ?? "");
  const [objectives, setObjectives]         = useState(MODULE_META["m1"]?.objectives ?? INIT_OBJECTIVES);
  const [tools, setTools]                   = useState(MODULE_META["m1"]?.tools ?? INIT_TOOLS);
  const [blocks, setBlocks]                 = useState<Block[]>(() => MODULE_BLOCKS["m1"] ?? INIT_BLOCKS);
  const [keyTerms, setKeyTerms]             = useState<KeyTerm[]>(INIT_KEY_TERMS);
  const [rejectMode, setRejectMode]         = useState(false);
  const [rejectReason, setRejectReason]     = useState("");
  const [saved, setSaved]                   = useState(false);
  const [draggedId, setDraggedId]           = useState<string | null>(null);
  const [dragOverId, setDragOverId]         = useState<string | null>(null);

  const sopModules = ALL_MODULES.filter(m => m.sopId === selectedSop);
  const approvedCount = sopModules.filter(m => statuses[m.id] === "approved").length;
  const selectedModule = ALL_MODULES.find(m => m.id === selectedMod)!;
  const currentStatus = statuses[selectedMod] ?? "pending";
  const st = STATUS[currentStatus];

  const updateBlock = (id: string, data: Record<string, any>) =>
    setBlocks(bs => {
      const next = bs.map(b => b.id === id ? { ...b, data } : b);
      MODULE_BLOCKS[selectedMod] = next as typeof MODULE_BLOCKS[string];
      return next;
    });

  const deleteBlock = (id: string) =>
    setBlocks(bs => bs.filter(b => b.id !== id));

  const moveBlock = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setBlocks(bs => {
      const from = bs.findIndex(b => b.id === fromId);
      const to   = bs.findIndex(b => b.id === toId);
      const next = [...bs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addBlock = (type: BType) => {
    const defaults: Record<BType, Record<string, any>> = {
      paragraph: { text: "New paragraph…" },
      steps:     { items: [{ title: "Step 1", body: "Describe the step here." }] },
      table:     { headers: ["Column A", "Column B"], rows: [["Row 1A", "Row 1B"]] },
      warning:   { text: "Warning message here.", level: "warning" },
      image:     { caption: "Image caption…" },
      video:     { url: "", title: "New video" },
    };
    setBlocks(bs => [...bs, { id: `b${Date.now()}`, type, data: defaults[type] }]);
  };

  const approve = () => {
    setStatuses(s => ({ ...s, [selectedMod]: "approved" }));
    updateModuleStatus(selectedMod, "approved");
    setRejectMode(false);
    setRejectReason("");
  };

  const submitReject = () => {
    if (!rejectReason.trim()) return;
    setStatuses(s => ({ ...s, [selectedMod]: "rejected" }));
    updateModuleStatus(selectedMod, "rejected");
    setRejectMode(false);
    setRejectReason("");
  };

  const selectMod = (id: string) => {
    setSelectedMod(id);
    setBlocks(MODULE_BLOCKS[id] ?? []);
    const mod = ALL_MODULES.find(m => m.id === id);
    if (mod) setModTitle(mod.title);
    const meta = MODULE_META[id];
    if (meta) {
      setSummary(meta.summary);
      setObjectives(meta.objectives);
      setTools(meta.tools);
    }
    setRejectMode(false);
    setRejectReason("");
  };

  const selectSop = (id: string) => {
    setSelectedSop(id);
    const first = ALL_MODULES.find(m => m.sopId === id);
    if (first) selectMod(first.id);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedSopData = SOPS.find(s => s.id === selectedSop)!;
  const ownerId = sopOwner(selectedSop);
  const isOwner = ownerId === myId;
  const locked = ownOnly && !isOwner;

  // ── NEW TWO-PANEL LAYOUT ────────────────────────────────────────────────────
  return (
    <div className="apex-review-materials flex bg-white" style={{ height: "calc(100vh - 56px)" }}>

        {/* Left panel: SOP info + module list */}
        <aside className="apex-review-materials-nav w-[272px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

          {/* SOP selector */}
          <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] mb-2">SOURCE SOP</p>
            <select
              value={selectedSop}
              onChange={e => selectSop(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#1A1F2E] focus:outline-none bg-white cursor-pointer"
            >
              {SOPS.map(sop => {
                const mods = ALL_MODULES.filter(m => m.sopId === sop.id);
                return <option key={sop.id} value={sop.id}>{sop.emoji} {sop.title} ({mods.length})</option>;
              })}
            </select>
          </div>

          {/* Ownership — a trainer can only modify what they created */}
          <div className="px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg"
              style={{ backgroundColor: locked ? "#FFFBEB" : "#F0FDFA" }}>
              {locked ? <Lock size={11} className="mt-0.5 shrink-0" style={{ color: "#B45309" }} />
                      : <CheckCircle size={11} className="mt-0.5 shrink-0" style={{ color: "#059669" }} />}
              <p className="text-[10px] leading-relaxed" style={{ color: locked ? "#92400E" : "#065F46" }}>
                {locked
                  ? `Read-only — created by ${staffById(ownerId ?? "")?.name ?? "another trainer"}. ${ROLE_META[role].label}s can edit only their own materials.`
                  : `You own this material${ownOnly ? "" : ` (${ROLE_META[role].label} access)`} — editing and approval are enabled.`}
              </p>
            </div>
          </div>

          {/* SOP info card */}
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `linear-gradient(135deg, ${selectedSopData.fromColor}, ${selectedSopData.toColor})` }}>
                {selectedSopData.emoji}
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-bold text-[#1A1F2E] leading-snug">{selectedSopData.title}</h2>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{selectedSopData.dept}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#9CA3AF]">Department</span>
                <span className="text-[11px] font-semibold text-[#374151]">{selectedSopData.dept}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#9CA3AF]">Version</span>
                <span className="text-[11px] font-semibold text-[#374151]">v1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#9CA3AF]">Material approved</span>
                <span className="text-[11px] font-bold" style={{ color: approvedCount === sopModules.length ? "#059669" : "#D97706" }}>
                  {approvedCount} / {sopModules.length}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3.5 w-full rounded-full bg-gray-100" style={{ height: 4 }}>
              <div
                className="rounded-full transition-all duration-500"
                style={{ height: 4, width: `${sopModules.length ? (approvedCount / sopModules.length) * 100 : 0}%`, backgroundColor: TEAL }}
              />
            </div>
          </div>

          {/* Module list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-4 pb-2">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF]">GENERATED MODULES</p>
            </div>
            {sopModules.map((mod, idx) => {
              const s = STATUS[statuses[mod.id] ?? "pending"];
              const isActive = selectedMod === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => selectMod(mod.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{
                    backgroundColor: isActive ? "#F0FDF9" : "transparent",
                    borderLeft: isActive ? `3px solid ${TEAL}` : "3px solid transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F9FAFB"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: isActive ? TEAL : "#F3F4F6", color: isActive ? "white" : "#9CA3AF" }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold leading-snug truncate" style={{ color: "#1A1F2E" }}>{mod.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: s.color }}>{s.label}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right panel: document view */}
        <div className="apex-review-materials-document flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#F8FAFB" }}>

          {/* Module top bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-3.5 flex items-center justify-between shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              MODULE {selectedModule?.number} OF {sopModules.length}
            </p>
            <div className="flex items-center gap-3">
              <span
                className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border"
                style={{ borderColor: st.color, color: st.color }}
              >
                {st.label}
              </span>
              <button
                onClick={() => setMode(m => m === "edit" ? "preview" : "edit")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-semibold text-[#6B7280] hover:bg-gray-50 hover:text-[#1A1F2E] transition-colors"
              >
                {mode === "edit" ? <Eye size={12} /> : <Pencil size={12} />}
                {mode === "edit" ? "Preview" : "Edit"}
              </button>
            </div>
          </div>

          {/* Scrollable document */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[760px] mx-auto px-8 py-8">

              {/* Module title */}
              {mode === "edit" ? (
                <input
                  type="text"
                  value={modTitle}
                  onChange={e => setModTitle(e.target.value)}
                  className="w-full text-[24px] font-extrabold text-[#1A1F2E] mb-6 focus:outline-none border-b-2 border-transparent focus:border-[#00C9A7] bg-transparent pb-1 transition-colors"
                />
              ) : (
                <h1 className="text-[24px] font-extrabold text-[#1A1F2E] mb-6">{modTitle}</h1>
              )}

              {/* AI Summary box */}
              <div className="rounded-xl p-5 mb-7" style={{ backgroundColor: "#ECFDF5", borderLeft: `4px solid ${TEAL}` }}>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] mb-2.5 flex items-center gap-1.5" style={{ color: TEAL }}>
                  <Sparkles size={10} style={{ color: TEAL }} />
                  AI SUMMARY
                </p>
                {mode === "edit" ? (
                  <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    rows={3}
                    className="w-full text-[13px] text-[#374151] leading-relaxed focus:outline-none resize-none bg-transparent"
                  />
                ) : (
                  <p className="text-[13px] text-[#374151] leading-relaxed">{summary}</p>
                )}
              </div>

              {/* What You Will Learn — 2-column grid */}
              <div className="mb-7">
                <h3 className="text-[16px] font-bold text-[#1A1F2E] mb-4">What You Will Learn</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                        style={{ borderColor: TEAL }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TEAL }} />
                      </div>
                      {mode === "edit" ? (
                        <input
                          type="text"
                          value={obj}
                          onChange={e => setObjectives(os => os.map((o, j) => j === i ? e.target.value : o))}
                          className="flex-1 text-[13px] text-[#374151] focus:outline-none border-b border-transparent focus:border-gray-300 bg-transparent transition-colors leading-snug"
                        />
                      ) : (
                        <span className="text-[13px] text-[#374151] leading-snug">{obj}</span>
                      )}
                    </div>
                  ))}
                </div>
                {mode === "edit" && (
                  <button
                    onClick={() => setObjectives(os => [...os, "New objective…"])}
                    className="flex items-center gap-1.5 text-[12px] font-semibold mt-3"
                    style={{ color: TEAL }}
                  >
                    <Plus size={12} /> Add objective
                  </button>
                )}
              </div>

              {/* Content blocks */}
              {mode === "edit" ? (
                <div className="mb-7">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-bold text-[#1A1F2E]">Content Blocks</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#9CA3AF] mr-1">Insert:</span>
                      {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
                        <button
                          key={type}
                          onClick={() => addBlock(type)}
                          title={label}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all border border-gray-200 hover:border-[#00C9A7] hover:text-[#00C9A7] text-[#6B7280]"
                        >
                          <Icon size={11} />
                          <span className="hidden xl:inline">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {blocks.map(b => (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; setDraggedId(b.id); }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverId(b.id); }}
                      onDrop={e => { e.preventDefault(); if (draggedId) moveBlock(draggedId, b.id); setDraggedId(null); setDragOverId(null); }}
                      onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                      className="mb-4 transition-opacity"
                      style={{
                        opacity: draggedId === b.id ? 0.35 : 1,
                        outline: dragOverId === b.id && draggedId !== b.id ? `2px solid ${TEAL}` : "2px solid transparent",
                        borderRadius: 12,
                      }}
                    >
                      {renderBlock(b, "edit", updateBlock, () => deleteBlock(b.id))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-7 space-y-6">
                  {blocks.map(block => <DocBlock key={block.id} block={block} />)}
                </div>
              )}

              {/* Tools */}
              <div className="mb-7">
                <h3 className="text-[16px] font-bold text-[#1A1F2E] mb-3">Tools &amp; Equipment Required</h3>
                <div className="flex flex-wrap gap-2">
                  {tools.map((t, i) => (
                    <span key={i} className="text-[12px] text-[#374151] px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: "#F3F4F6" }}>
                      {t}
                      {mode === "edit" && (
                        <button onClick={() => setTools(ts => ts.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400 text-[15px] leading-none">×</button>
                      )}
                    </span>
                  ))}
                  {mode === "edit" && (
                    <button
                      onClick={() => setTools(ts => [...ts, "New tool"])}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors flex items-center gap-1"
                    >
                      <Plus size={11} /> Add
                    </button>
                  )}
                </div>
              </div>

              {/* Key Terms */}
              {keyTerms.length > 0 && (
                <div className="mb-7">
                  <h3 className="text-[16px] font-bold text-[#1A1F2E] mb-3">Key Terms</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {keyTerms.map((kt, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-4 bg-white">
                        {mode === "edit" ? (
                          <>
                            <input
                              type="text"
                              value={kt.term}
                              onChange={e => setKeyTerms(kts => kts.map((k, j) => j === i ? { ...k, term: e.target.value } : k))}
                              className="w-full text-[12px] font-bold text-[#1A1F2E] focus:outline-none border-b border-transparent focus:border-gray-300 pb-0.5 mb-1.5 bg-transparent"
                            />
                            <textarea
                              value={kt.def}
                              onChange={e => setKeyTerms(kts => kts.map((k, j) => j === i ? { ...k, def: e.target.value } : k))}
                              rows={2}
                              className="w-full text-[11px] text-[#6B7280] focus:outline-none resize-none bg-transparent leading-relaxed"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-[12px] font-bold text-[#1A1F2E]">{kt.term}</p>
                            <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">{kt.def}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reject reason */}
              {rejectMode && (
                <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <p className="text-[12px] font-semibold text-[#DC2626] mb-2">Rejection Reason</p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Describe why this module is being rejected so AI can regenerate accurately…"
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-[#FCA5A5] rounded-lg text-[12px] text-[#1A1F2E] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={submitReject}
                      disabled={!rejectReason.trim()}
                      className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40 transition-opacity"
                      style={{ backgroundColor: "#DC2626" }}
                    >
                      Submit Rejection
                    </button>
                    <button
                      onClick={() => { setRejectMode(false); setRejectReason(""); }}
                      className="px-4 py-1.5 rounded-lg text-[12px] text-[#9CA3AF] hover:text-[#6B7280]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  {currentStatus === "rejected" && (
                    <span className="flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                      <XCircle size={12} /> Rejected — awaiting regeneration
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-[#6B7280] hover:border-gray-300 hover:text-[#1A1F2E] transition-colors"
                  >
                    {saved ? "✓ Saved" : "Save Draft"}
                  </button>
                  {currentStatus !== "approved" && (
                    <button
                      onClick={() => setRejectMode(r => !r)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold border-2 text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                      style={{ borderColor: "#DC2626" }}
                    >
                      <XCircle size={13} />
                      {rejectMode ? "Cancel" : "Reject & Regenerate"}
                    </button>
                  )}
                  {currentStatus !== "approved" ? (
                    <button
                      onClick={approve}
                      disabled={locked}
                      title={locked ? "You can only approve materials you created" : undefined}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: locked ? "#D1D5DB" : "#059669", cursor: locked ? "not-allowed" : "pointer" }}
                    >
                      {locked ? <Lock size={13} /> : <CheckCircle size={13} />} Approve Module
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-[#059669] bg-[#ECFDF5]">
                      <CheckCircle size={13} /> Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

