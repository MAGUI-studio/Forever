"use client";

/** Three connected swags span the entire page; fixed art, not editable copy. */
export function RomanceGarland(){
 return <div aria-hidden="true" className="pointer-events-none w-full overflow-hidden py-2 text-[var(--forever-primary,#722F37)] opacity-[0.18]">
  <svg viewBox="0 0 1440 130" fill="none" preserveAspectRatio="none" className="h-20 w-full sm:h-28 lg:h-36" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
   <path vectorEffect="non-scaling-stroke" d="M-20 10Q230 125 480 10Q720 125 960 10Q1200 125 1460 10"/>
   {[0,480,960].flatMap(offset=>[80,190,300,410].map((x,index)=>{
    const y=10+230*(x/480)*(1-x/480),drop=index%2?22:15;
    return <g key={offset+x} transform={`translate(${offset+x} ${y})`}><path vectorEffect="non-scaling-stroke" d={`M0 0v${drop}`}/><path vectorEffect="non-scaling-stroke" d={`M0 ${drop+27}C-34 ${drop+8} -22 ${drop-8} 0 ${drop+4}C22 ${drop-8} 34 ${drop+8} 0 ${drop+27}Z`}/></g>;
   }))}
  </svg>
 </div>;
}
