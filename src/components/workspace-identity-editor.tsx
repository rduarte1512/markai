"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Globe2, Loader2, Save, ShieldCheck } from "lucide-react";

function cleanSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function WorkspaceIdentityEditor({ workspaceName, workspaceSlug }: { workspaceName: string; workspaceSlug: string }) {
  const router = useRouter();
  const [name, setName] = useState(workspaceName);
  const [slug, setSlug] = useState(workspaceSlug);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(workspaceName);
    setSlug(workspaceSlug);
  }, [workspaceName, workspaceSlug]);

  const dirty = useMemo(() => name.trim() !== workspaceName || cleanSlug(slug) !== workspaceSlug, [name, slug, workspaceName, workspaceSlug]);

  async function saveWorkspace() {
    const cleanName = name.trim();
    const nextSlug = cleanSlug(slug);
    if (cleanName.length < 2 || cleanName.length > 70) {
      setError("O nome deve ter entre 2 e 70 caracteres.");
      return;
    }
    if (nextSlug.length < 2) {
      setError("A URL do workspace precisa de pelo menos 2 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: cleanName, slug: nextSlug }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; workspace?: { name: string; slug: string } } | null;
      if (!response.ok) throw new Error(payload?.error || "Não foi possível guardar o workspace.");
      setName(payload?.workspace?.name || cleanName);
      setSlug(payload?.workspace?.slug || nextSlug);
      setMessage("Informações do workspace guardadas com sucesso.");
      router.refresh();
      window.setTimeout(() => setMessage(""), 2500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível guardar o workspace.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="workspace-identity-editor">
      <header>
        <div className="workspace-editor-title">
          <span><Building2 size={18}/></span>
          <div><small>Workspace atual</small><h2>Identidade e endereço</h2><p>Edita os dados deste workspace. As alterações ficam guardadas e aparecem em toda a aplicação.</p></div>
        </div>
        <span className="workspace-editor-security"><ShieldCheck size={14}/> Guardado na base de dados</span>
      </header>

      <div className="workspace-editor-grid">
        <label>
          <span>Nome do workspace</span>
          <div className="workspace-editor-input"><Building2 size={15}/><input value={name} maxLength={70} onChange={(event) => { setName(event.target.value); setMessage(""); setError(""); }}/></div>
          <small>É o nome apresentado no seletor, dashboard e relatórios.</small>
        </label>
        <label>
          <span>URL do workspace</span>
          <div className="workspace-editor-input"><Globe2 size={15}/><em>markai.app/</em><input value={slug} maxLength={48} onChange={(event) => { setSlug(cleanSlug(event.target.value)); setMessage(""); setError(""); }}/></div>
          <small>Identificador único do workspace. Usa letras, números e hífen.</small>
        </label>
      </div>

      <footer>
        <div className="workspace-editor-feedback">
          {message && <span className="success"><CheckCircle2 size={14}/>{message}</span>}
          {error && <span className="error">{error}</span>}
        </div>
        <button type="button" disabled={saving || !dirty} onClick={() => void saveWorkspace()}>
          {saving ? <Loader2 className="spin" size={15}/> : <Save size={15}/>} {saving ? "A guardar…" : dirty ? "Guardar alterações" : "Tudo guardado"}
        </button>
      </footer>
    </section>
  );
}
