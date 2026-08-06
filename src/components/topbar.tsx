import { Bell, Building2, ChevronDown } from "lucide-react";
import { getInitials } from "@/lib/format";

export function Topbar({ workspaceName, userName }: { workspaceName: string; userName: string }) {
  return (
    <header className="dashboard-topbar">
      <div className="workspace-switch">
        <div className="workspace-switch-icon"><Building2 size={17}/></div>
        <div><strong>{workspaceName}</strong><small>Workspace da agência</small></div>
        <ChevronDown size={14} className="muted"/>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notificações"><Bell size={17}/></button>
        <div className="avatar" title={userName}>{getInitials(userName)}</div>
        <form action="/api/auth/logout" method="post">
          <button className="button button-ghost button-sm" type="submit">Sair</button>
        </form>
      </div>
    </header>
  );
}
