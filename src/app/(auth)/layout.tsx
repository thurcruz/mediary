import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-12">
      <Image src="/brand/MEDIARY_FAVICON_AZUL.png" alt="Mediary" width={56} height={56} className="rounded-2xl" />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
