import { MediaSearch } from "@/components/media/media-search";

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Buscar</h1>
      <MediaSearch />
    </div>
  );
}
