export function PrefixedInput({
  prefix,
  id,
  name,
  defaultValue,
  placeholder,
}: {
  prefix: string;
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex h-11 items-center overflow-hidden rounded-2xl border border-border bg-surface pr-3 transition-colors focus-within:border-primary">
      <span className="shrink-0 select-none pl-4 text-sm text-muted">{prefix}</span>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2.5 pl-0.5 text-sm text-foreground outline-none placeholder:text-muted"
      />
    </div>
  );
}
