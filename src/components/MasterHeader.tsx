import { CogIcon } from "lucide-react";

function MasterHeader() {
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <CogIcon />
        </span>
        Setting
      </div>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-base-content">
        Master Data
      </h1>

      <p className="mt-1 max-w-2xl text-sm leading-6 text-base-content/60">
        Setting semester, ruangan, mata kuliah, dan program studi.
      </p>
    </div>
  );
}

export default MasterHeader;
