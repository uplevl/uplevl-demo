export default function VideoFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="aspect-[9/16] border border-brand-deep-gray/5 rounded-lg bg-gradient-to-b from-brand-deep-gray/5 to-brand-deep-gray/7 overflow-hidden">
      {children}
    </div>
  );
}
