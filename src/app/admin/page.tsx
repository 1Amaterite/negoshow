"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Upload, Database, CheckCircle, FilePlus, Check, MapPin, ChevronDown, RefreshCw, Clock, Trash2, Info, AlertTriangle, X } from "lucide-react";
import { PageHeader, SL } from "@/components/ui";
import { useGlobal } from "@/lib/GlobalContext";

type AdminTab = "upload" | "validate";
type DocStatus = "processing" | "validated" | "published";

interface UploadedDoc {
  id: number;
  filename: string;
  sourceOffice: string;
  bulletinDate: string;
  coverage: string;
  docType: "PDF" | "Image";
  commodities: string[];
  status: DocStatus;
  uploadedAt: string;
}

interface AdminRecord {
  id: number;
  commodity: string;
  price: number;
  location: string;
  date: string;
  source: string;
  status: "pending" | "approved" | "rejected";
  flagged?: boolean;
  flagReason?: string;
}

const INITIAL_RECORDS: AdminRecord[] = [
  { id: 1, commodity: "Sibuyas Pula", price: 165, location: "Pasay City Market", date: "Jul 10, 2026", source: "doc_5592.pdf", status: "pending", flagged: true, flagReason: "Variance > 15% (vs ₱140)" },
  { id: 2, commodity: "Bawang", price: 120, location: "Pasay City Market", date: "Jul 10, 2026", source: "doc_5592.pdf", status: "pending" },
  { id: 3, commodity: "Luya", price: 140, location: "Makati City Market", date: "Jul 09, 2026", source: "img_8821.jpg", status: "approved" },
];

const INITIAL_UPLOADS: UploadedDoc[] = [
  { id: 101, filename: "DA_Bulletin_NCR_Jul9.pdf", sourceOffice: "DA Bantay Presyo (NCR)", bulletinDate: "2026-07-09", coverage: "Metro Manila", docType: "PDF", commodities: ["Sibuyas Pula","Bawang","Luya"], status: "published", uploadedAt: "Jul 09, 08:30 AM" },
];

const COVERAGE_AREAS = ["Metro Manila", "NCR - Pasay City", "NCR - Quezon City", "NCR - Manila City", "Region IV-A"];
const COMMODITY_NAMES = ["Sibuyas Pula", "Bawang", "Luya", "Kamatis", "Siling Labuyo", "Kangkong", "Pechay"];

const DOC_STATUS: Record<DocStatus, { label: string; cls: string }> = {
  processing: { label: "Pinoproseso ng AI", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  validated:  { label: "Handa i-publish",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  published:  { label: "Na-publish na",     cls: "bg-green-50 text-green-700 border-green-200" },
};

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, logout } = useGlobal();
  const [tab, setTab] = useState<AdminTab>("upload");
  const [records, setRecords] = useState<AdminRecord[]>(INITIAL_RECORDS);
  const [uploads, setUploads] = useState<UploadedDoc[]>(INITIAL_UPLOADS);

  // Upload form state
  const [sourceOffice, setSourceOffice] = useState("");
  const [bulletinDate, setBulletinDate] = useState("");
  const [coverage, setCoverage] = useState("");
  const [docType, setDocType] = useState<"PDF"|"Image">("PDF");
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedComms, setSelectedComms] = useState<string[]>([]);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login");
    }
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const toggleComm = (name: string) =>
    setSelectedComms((p) => p.includes(name) ? p.filter((c)=>c!==name) : [...p, name]);

  const canUpload = sourceOffice && bulletinDate && coverage && selectedFile && selectedComms.length > 0;

  const handleUpload = () => {
    if (!canUpload) return;
    setUploading(true);
    setTimeout(()=>{
      const doc: UploadedDoc = {
        id: Date.now(), filename: selectedFile, sourceOffice, bulletinDate, coverage,
        docType, commodities: selectedComms, status: "processing",
        uploadedAt: new Date().toLocaleString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),
      };
      setUploads((p)=>[doc,...p]);
      setTimeout(()=>setUploads((p)=>p.map((d)=>d.id===doc.id?{...d,status:"validated"}:d)), 2000);
      setSourceOffice(""); setBulletinDate(""); setCoverage("");
      setSelectedFile(""); setSelectedComms([]);
      setUploading(false); setUploadSuccess(true);
      setTimeout(()=>setUploadSuccess(false), 3500);
    }, 1200);
  };

  const publishDoc  = (id: number) => setUploads((p)=>p.map((d)=>d.id===id&&d.status==="validated"?{...d,status:"published"}:d));
  const deleteDoc   = (id: number) => setUploads((p)=>p.filter((d)=>d.id!==id));
  const updateRec   = (id: number, status: "approved"|"rejected") => setRecords((p)=>p.map((r)=>r.id===id?{...r,status}:r));

  const pending = records.filter((r)=>r.status==="pending");
  const done    = records.filter((r)=>r.status!=="pending");

  const onLogout = () => {
    logout();
    router.push("/more");
  };

  return (
    <div className="admin-dashboard min-h-screen bg-muted/30">
      <PageHeader
        title="Dashboard ng Admin" subtitle="NegoShow Talipapa Utility" onBack={() => router.push("/more")}
        right={
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
            <LogOut size={12}/>Mag-logout
          </button>
        }
      />

      {/* Tabs */}
      <div className="admin-tabs flex bg-muted border-b border-border md:flex-col md:border md:rounded-2xl md:overflow-hidden md:bg-card">
        {([["upload","I-upload",Upload],["validate","I-validate",Database]] as [AdminTab,string,React.ElementType][]).map(([id,label,Icon])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors border-b-2 ${
              tab===id?"border-primary text-primary bg-background":"border-transparent text-muted-foreground"
            }`}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* ── UPLOAD TAB ─── */}
      {tab==="upload" && (
        <div className="admin-content px-4 md:px-0 pt-5 md:pt-0 pb-6 space-y-5">
          {uploadSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle size={15} className="text-green-600 shrink-0"/>
              <p className="text-xs text-green-800 font-semibold">Na-upload na ang dokumento. Naka-queue para sa validation.</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <FilePlus size={14} className="text-primary"/>
              <p className="text-sm font-bold text-foreground">Mag-upload ng Bagong Bulletin</p>
            </div>
            <div className="px-4 py-4 space-y-4">

              {/* File */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Dokumento</label>
                <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden"
                  onChange={(e)=>setSelectedFile(e.target.files?.[0]?.name??"")}/>
                <button onClick={()=>fileRef.current?.click()}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition-colors active:bg-muted ${
                    selectedFile?"border-primary bg-primary/5":"border-border bg-card"
                  }`}>
                  <Upload size={18} className={selectedFile?"text-primary":"text-muted-foreground"}/>
                  <div className="flex-1 text-left min-w-0">
                    {selectedFile
                      ? <p className="text-sm font-semibold text-primary truncate">{selectedFile}</p>
                      : <><p className="text-sm font-semibold text-muted-foreground">Pumili ng PDF o Image file</p><p className="text-xs text-muted-foreground">Mag-tap para mag-browse</p></>}
                  </div>
                  {selectedFile && <Check size={16} className="text-primary shrink-0"/>}
                </button>
              </div>

              {/* Doc type */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Uri ng Dokumento</label>
                <div className="flex bg-muted rounded-full overflow-hidden w-fit">
                  {(["PDF","Image"] as const).map((t)=>(
                    <button key={t} onClick={()=>setDocType(t)}
                      className={`px-4 py-1.5 text-xs font-bold transition-colors ${docType===t?"bg-primary text-white":"text-muted-foreground"}`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Source office */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Source Office</label>
                <input type="text" value={sourceOffice} onChange={(e)=>setSourceOffice(e.target.value)}
                  placeholder="e.g. DA – Region IV-A, LGU Pasay City"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"/>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Petsa ng Bulletin</label>
                <input type="date" value={bulletinDate} onChange={(e)=>setBulletinDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"/>
              </div>

              {/* Coverage */}
              <div className="relative">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Coverage Area</label>
                <button onClick={()=>setCoverageOpen(!coverageOpen)}
                  className="w-full flex items-center gap-2 bg-background border border-border rounded-xl px-4 py-3 text-left">
                  <MapPin size={14} className="text-muted-foreground shrink-0"/>
                  <span className={`flex-1 text-sm ${coverage?"text-foreground font-medium":"text-muted-foreground/60"}`}>{coverage||"Piliin ang lugar na covered…"}</span>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${coverageOpen?"rotate-180":""}`}/>
                </button>
                {coverageOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                    {COVERAGE_AREAS.map((area)=>(
                      <button key={area} onClick={()=>{setCoverage(area);setCoverageOpen(false);}}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors border-b border-border last:border-0 font-medium">{area}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Commodities */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Mga Kalakal na Nakalagay</label>
                <div className="flex flex-wrap gap-2">
                  {COMMODITY_NAMES.map((name)=>{
                    const active = selectedComms.includes(name);
                    return (
                      <button key={name} onClick={()=>toggleComm(name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                          active?"bg-primary text-white border-primary":"bg-card border-border text-foreground"
                        }`}>
                        {active&&<Check size={10} className="inline mr-1"/>}{name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleUpload} disabled={!canUpload||uploading}
                className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none">
                {uploading?<><RefreshCw size={14} className="animate-spin"/>Ina-upload…</>:<><Upload size={14}/>I-upload ang Bulletin</>}
              </button>
            </div>
          </div>

          {/* Uploads log */}
          <div>
            <SL>Mga Na-upload na Dokumento</SL>
            <div className="space-y-2">
              {uploads.map((doc)=>{
                const s = DOC_STATUS[doc.status];
                return (
                  <div key={doc.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold ${doc.docType==="PDF"?"bg-red-600":"bg-blue-600"}`}>{doc.docType}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-foreground truncate flex-1">{doc.filename}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${s.cls}`}>{s.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{doc.sourceOffice} · {doc.coverage}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={9}/>{doc.uploadedAt}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {doc.commodities.map((c)=><span key={c} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{c}</span>)}
                        </div>
                      </div>
                    </div>
                    {(doc.status==="validated"||doc.status==="processing") && (
                      <div className="flex gap-2 px-4 pb-3">
                        {doc.status==="validated" && (
                          <button onClick={()=>publishDoc(doc.id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-bold py-2 rounded-lg active:scale-[0.97] transition-all">
                            <Check size={12}/>I-publish
                          </button>
                        )}
                        <button onClick={()=>deleteDoc(doc.id)}
                          className="flex items-center justify-center gap-1 bg-card border border-red-200 text-red-600 text-xs font-bold px-3 py-2 rounded-lg active:scale-[0.97] transition-all">
                          <Trash2 size={12}/>Tanggalin
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VALIDATE TAB ─── */}
      {tab==="validate" && (
        <div className="px-4 pt-4 pb-6 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label:"Naghihintay",  count:pending.length,                              color:"bg-amber-100 text-amber-700" },
              { label:"Approved", count:done.filter(r=>r.status==="approved").length, color:"bg-green-100 text-green-700" },
              { label:"Tinanggihan", count:done.filter(r=>r.status==="rejected").length, color:"bg-red-100 text-red-700"   },
            ].map(({label,count,color})=>(
              <div key={label} className={`rounded-xl px-3 py-3 text-center border ${color}`}>
                <p className="text-2xl font-extrabold">{count}</p>
                <p className="text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border px-4 py-3 flex items-start gap-2">
            <Info size={13} className="text-primary mt-0.5 shrink-0"/>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ang mga record na ito ay na-extract mula sa mga na-upload na bulletin. I-review bago i-approve para ma-publish sa vendor-facing na dashboard.
            </p>
          </div>

          {pending.length > 0 && (
            <div>
              <SL>Para sa Review</SL>
              <div className="space-y-2">
                {pending.map((r)=>(
                  <div key={r.id} className={`bg-card rounded-xl border overflow-hidden ${r.flagged?"border-red-300":"border-border"}`}>
                    {r.flagged && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border-b border-red-200">
                        <AlertTriangle size={13} className="text-red-600"/>
                        <p className="text-xs font-semibold text-red-700">{r.flagReason}</p>
                      </div>
                    )}
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-bold text-foreground">{r.commodity}</p>
                          <p className="text-xs text-muted-foreground">{r.location} · {r.date} · {r.source}</p>
                        </div>
                        <p className={`text-lg font-extrabold shrink-0 ${r.flagged?"text-red-700":"text-foreground"}`}>₱{r.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>updateRec(r.id,"approved")}
                          className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-bold py-2.5 rounded-lg active:scale-[0.97] transition-all">
                          <Check size={13}/>I-approve
                        </button>
                        <button onClick={()=>updateRec(r.id,"rejected")}
                          className="flex-1 flex items-center justify-center gap-1 bg-card border border-red-200 text-red-600 text-xs font-bold py-2.5 rounded-lg active:scale-[0.97] transition-all">
                          <X size={13}/>I-reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <SL>Natapos na</SL>
              <div className="space-y-2">
                {done.map((r)=>(
                  <div key={r.id} className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.commodity} — ₱{r.price}</p>
                      <p className="text-xs text-muted-foreground">{r.location} · {r.date}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${r.status==="approved"?"bg-green-100 text-green-700 border-green-200":"bg-red-100 text-red-700 border-red-200"}`}>
                      {r.status==="approved"?"Approved":"Tinanggihan"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
