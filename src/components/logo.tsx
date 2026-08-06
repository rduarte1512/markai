import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link className="logo" href={href}>
      <span className="logo-mark"><Sparkles size={18} strokeWidth={2.4} /></span>
      <span>MarkAI</span>
    </Link>
  );
}
