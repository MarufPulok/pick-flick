/** Matches the shared page shape: title, KPI row, main column plus side column. */
export default function AdminLoading() {
  const block = 'skeleton rounded-md bg-foreground/10';
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className={`${block} h-10 w-56`} />
      <div className={`${block} mt-3 h-4 w-80`} />
      <div className="mt-10 grid grid-cols-2 gap-8 border-b border-border pb-8 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <div className={`${block} h-4 w-28`} />
            <div className={`${block} mt-3 h-10 w-32`} />
            <div className={`${block} mt-4 h-7 w-full`} />
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`${block} h-72`} />
        <div className={`${block} h-72`} />
      </div>
    </div>
  );
}
