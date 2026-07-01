import { CmsTabs } from "@/components/CmsTabs";

type CmsModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  fields: string[];
};

export function CmsModulePage({ eyebrow: _eyebrow, title, description: _description, fields }: CmsModulePageProps) {
  return (
    <section>
      <CmsTabs />
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
        <h1 className="text-4xl font-black text-slate-950">{title}</h1>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <h2 className="text-xl font-black text-slate-950">Add / Edit Record</h2>
          {fields.slice(0, 5).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-black">
              {field}
              <input className="min-h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-adminBlue" />
            </label>
          ))}
          <button className="min-h-11 rounded-lg bg-adminBlue text-sm font-black text-white" type="submit">
            Save draft
          </button>
        </form>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">Records</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-adminBlue">Supabase-ready</span>
          </div>
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
            Records will appear here after Supabase tables and CRUD actions are connected.
          </div>
        </div>
      </div>
    </section>
  );
}
