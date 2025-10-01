export default function Topbar({ title }: { title: string }) {
   return (
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-white/10">
         <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold">{title}</h1>
         </div>
      </header>
   );
}
