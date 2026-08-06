import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return <main style={{minHeight: "100vh", display: "grid", placeItems: "center", padding: 24}}><div className="empty-state"><div className="empty-icon"><SearchX size={24}/></div><h3>Página não encontrada</h3><p>O endereço pode ter mudado ou não tens acesso a este recurso.</p><Link className="button button-primary" href="/dashboard"><ArrowLeft size={15}/> Voltar ao dashboard</Link></div></main>;
}
