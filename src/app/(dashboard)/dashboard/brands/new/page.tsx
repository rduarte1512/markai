import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandForm } from "@/components/brand-form";

export const metadata = { title: "Nova marca" };

export default function NewBrandPage() {
  return (
    <>
      <div className="page-heading">
        <div><Link className="button button-ghost button-sm" href="/dashboard/brands"><ArrowLeft size={14}/> Voltar</Link><h1 style={{marginTop: 14}}>Criar Brand Kit</h1><p>Preenche o essencial ou usa a IA para acelerar o onboarding.</p></div>
      </div>
      <section className="card"><div className="card-header"><div><h2>Informação da marca</h2><p>Estes dados serão usados em todas as gerações.</p></div></div><div className="card-body"><BrandForm /></div></section>
    </>
  );
}
