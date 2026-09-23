export default function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#08111f]">
      <div className="absolute -top-48 left-[10%] h-[34rem] w-[34rem] rounded-full bg-sky-500/[0.10] blur-[120px]" />
      <div className="absolute -right-48 top-32 h-[30rem] w-[30rem] rounded-full bg-indigo-500/[0.08] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px]" />
    </div>
  );
}
