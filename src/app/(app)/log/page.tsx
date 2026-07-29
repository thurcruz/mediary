import { MediaSearch } from "@/components/media/media-search";

export default function LogPage() {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Registrar</h1>
        <p className="mt-1 text-sm text-muted">
          Busque o que você assistiu, leu ou ouviu para registrar no seu diário.
        </p>
      </div>
      <MediaSearch placeholder="O que você quer registrar?" />
    </div>
  );
}
