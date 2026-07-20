"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useGlobal } from "@/lib/GlobalContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useGlobal();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [capsLock, setCapsLock] = useState(false);

  const handleLogin = async () => {
    const nextErrors: { username?: string; password?: string } = {};
    const cleanUsername = username.trim();

    if (!cleanUsername) nextErrors.username = "Kailangan ang username.";
    if (!password) nextErrors.password = "Kailangan ang password.";
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Ayusin ang mga naka-highlight na field.");
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});
    
    // MVP hardcoded auth
    setTimeout(() => {
      const success = login(password);
      if (cleanUsername === "admin" && success) {
        setAttempts(0);
        router.push("/admin");
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setError(nextAttempts >= 3
          ? "Ilang beses nang nabigo ang pag-login. Suriin ang iyong detalye o makipag-ugnayan sa tagapangasiwa."
          : "Hindi tugma ang username o password. Subukan muli.");
        setPassword("");
        setFieldErrors({ password: "Hindi tugma ang username o password sa aming tala." });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <PageHeader title="Pag-login ng Admin" onBack={() => router.push("/more")}/>
      <div className="px-4 md:px-8 py-8 md:py-14">
        <div className="mx-auto max-w-md bg-background md:bg-card md:border md:border-border md:rounded-3xl md:shadow-xl md:shadow-primary/5 md:p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
            <Lock size={28} className="text-white"/>
          </div>
          <h2 className="text-lg font-extrabold text-foreground">NegoShow Admin</h2>
          <p className="text-xs text-muted-foreground mt-1 text-center">Limitadong akses. Kailangan ang detalye ng admin.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Username</label>
            <input type="text" value={username} onChange={(e)=>{setUsername(e.target.value); setFieldErrors((p)=>({...p,username:undefined})); setError("");}} placeholder="Ilagay ang username"
              autoComplete="username" aria-invalid={Boolean(fieldErrors.username)}
              className={`w-full bg-card border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${fieldErrors.username?"border-red-400 focus:border-red-500 focus:ring-red-100":"border-border focus:border-primary focus:ring-primary/20"}`}/>
            {fieldErrors.username && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.username}</p>}
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass?"text":"password"} value={password} onChange={(e)=>{setPassword(e.target.value); setFieldErrors((p)=>({...p,password:undefined})); setError("");}} placeholder="Ilagay ang password"
                onKeyDown={(e)=>{ setCapsLock(e.getModifierState("CapsLock")); if(e.key==="Enter") handleLogin(); }} onKeyUp={(e)=>setCapsLock(e.getModifierState("CapsLock"))} autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)}
                className={`w-full bg-card border rounded-xl px-4 py-3.5 pr-12 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all ${fieldErrors.password?"border-red-400 focus:border-red-500 focus:ring-red-100":"border-border focus:border-primary focus:ring-primary/20"}`}/>
              {fieldErrors.password && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
              {capsLock && <p className="mt-1.5 text-xs font-semibold text-amber-700">Naka-on ang Caps Lock.</p>}
              <button type="button" aria-label={showPass?"Itago ang password":"Ipakita ang password"} onClick={()=>setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-90 transition-transform">
                {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-red-600 shrink-0"/>
              <p className="text-xs text-red-700 font-semibold">{error}</p>
            </div>
          )}
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-primary text-white font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 mt-2">
            {loading?<><RefreshCw size={16} className="animate-spin"/>Nagche-check…</>:<><Lock size={16}/>Mag-login bilang Admin</>}
          </button>
        </div>
        <div className="mt-8 bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            Ang admin area ay para lamang sa mga awtorisadong tauhan ng NegoShow. Para sa access, makipag-ugnayan sa inyong system administrator.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
