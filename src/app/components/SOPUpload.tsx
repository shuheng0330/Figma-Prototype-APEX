import { useState, useRef } from "react";
import {
  Upload,
  CheckCircle,
  X,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";

const TEAL = "#00C9A7";

const DEPTS = ["Engineering", "Sales", "Finance", "Operations", "HR", "IT"];

// ── Reusable styled input ─────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1F2E] placeholder-[#C4C9D4] focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/40 focus:border-[#00C9A7] transition-all";

export function SOPUpload() {
  const [showBanner, setShowBanner] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    if (uploading) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file.name);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Page Title Row ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#1A1F2E] leading-tight">
            Upload New SOP Document
          </h1>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            Add and version-control SOP documents for AI training generation
          </p>
        </div>

      </div>

      {/* ── AI Info Banner ─────────────────────────────────────────────── */}
      {showBanner && (
        <div className="flex items-start gap-3 px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg mb-5">
          <AlertCircle size={15} className="text-[#3B82F6] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[#1D4ED8] flex-1">
            <span className="font-semibold">AI processing active.</span>{" "}
            Uploaded SOPs will be converted into training materials within 24 hours.
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="text-[#93C5FD] hover:text-[#3B82F6] transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Main Card ──────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-lg p-6"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${
            isDragging
              ? "border-[#00C9A7] bg-[#E8FAF7]"
              : selectedFile
              ? "border-[#00C9A7]/50 bg-[#F0FDF9]"
              : "border-gray-200 hover:border-[#00C9A7]/60 hover:bg-[#FAFFFE]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: selectedFile ? "#E8FAF7" : "#F4F6F9" }}
          >
            {selectedFile ? (
              <FileText size={24} style={{ color: TEAL }} />
            ) : (
              <Upload size={24} className="text-[#9CA3AF]" />
            )}
          </div>

          {selectedFile ? (
            <div className="text-center">
              <p className="text-[14px] font-semibold text-[#1A1F2E]">{selectedFile}</p>
              <p className="text-[12px] text-[#9CA3AF] mt-1">Click to change file</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[14px] text-[#6B7280]">
                Drag &amp; drop your PDF or DOCX here, or{" "}
                <span style={{ color: TEAL }} className="font-semibold cursor-pointer hover:underline">
                  Browse Files
                </span>
              </p>
              <p className="text-[12px] text-[#9CA3AF] mt-1">
                Supports PDF, DOCX, PPT, PPTX, XLS, XLSX &nbsp;·&nbsp; Max 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="mt-6 space-y-4">
          <Field label="SOP Title">
            <input
              type="text"
              placeholder="e.g. Data Privacy Guidelines v2"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select className={inputCls}>
                {DEPTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Version">
              <input
                type="text"
                placeholder="e.g. v2.1"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-[14px] font-semibold text-white transition-all disabled:opacity-70"
            style={{ backgroundColor: TEAL }}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Upload &amp; Generate Training
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Success Banner ─────────────────────────────────────────────── */}
      {uploaded && (
        <div className="flex items-start gap-3 px-4 py-3 bg-[#ECFDF5] border border-[#6EE7B7] rounded-lg mt-4">
          <CheckCircle size={16} className="text-[#059669] mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#065F46]">
              ✓ SOP Uploaded Successfully
            </p>
            <p className="text-[12px] text-[#059669] mt-0.5">
              AI is generating training material. Est. ready in 20 mins.
            </p>
          </div>
          <button
            onClick={() => setUploaded(false)}
            className="ml-auto text-[#6EE7B7] hover:text-[#059669] transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Recent Uploads ─────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-lg mt-5"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#1A1F2E]">Recent Uploads</h2>
          <span className="text-[11px] text-[#9CA3AF]">Last 7 days</span>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { name: "Data Privacy Guidelines", dept: "IT", ver: "v2.1", date: "Today, 09:15", status: "Ready", statusColor: "#059669", statusBg: "#ECFDF5" },
            { name: "Customer Service Protocol", dept: "Sales", ver: "v1.4", date: "Yesterday, 14:32", status: "Processing", statusColor: "#D97706", statusBg: "#FEF3C7" },
            { name: "Financial Reporting SOP", dept: "Finance", ver: "v3.0", date: "3 days ago", status: "Ready", statusColor: "#059669", statusBg: "#ECFDF5" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#E8FAF7" }}
              >
                <FileText size={14} style={{ color: TEAL }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1A1F2E] truncate">{item.name}</p>
                <p className="text-[11px] text-[#9CA3AF]">
                  {item.dept} &nbsp;·&nbsp; {item.ver} &nbsp;·&nbsp; {item.date}
                </p>
              </div>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                style={{ color: item.statusColor, backgroundColor: item.statusBg }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
