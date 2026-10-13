"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

type ExpansionGroup = { expanded: Set<string>; expand: (id: string) => void };
const ExpansionContext = createContext<ExpansionGroup | null>(null);

export function ExpandingIconButtonGroup({
  children,
  className,
  as: Element = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "span";
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  return (
    <ExpansionContext.Provider
      value={{
        expanded,
        expand: (id) =>
          setExpanded((current) =>
            current.has(id) ? current : new Set([...current, id]),
          ),
      }}
    >
      <Element
        className={className}
        onPointerLeave={() => setExpanded(new Set())}
      >
        {children}
      </Element>
    </ExpansionContext.Provider>
  );
}

export function ExpandingIconButton({
  icon,
  label,
  className = "",
  onPointerEnter,
  onPointerLeave,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  icon: ReactNode;
  label: string;
}) {
  const id = useId();
  const group = useContext(ExpansionContext);
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      {...props}
      type={type}
      className={
        "group/expanding inline-flex min-h-[42px] min-w-[42px] w-auto shrink-0 cursor-pointer items-center justify-center gap-0 rounded-[var(--wedding-radius,12px)] border-0 bg-transparent px-3 py-2.5 text-xs text-[var(--forever-primary,#5D613C)] transition-colors duration-200 enabled:hover:bg-[#edf0e3] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--forever-primary,#5D613C)] disabled:cursor-not-allowed disabled:opacity-45 [&>svg]:shrink-0 [&>svg]:transition-transform [&>svg]:duration-[550ms] [&>svg]:ease-[cubic-bezier(.4,0,.2,1)] hover:[&>svg]:-translate-y-px motion-reduce:[&>svg]:transition-none " +
        className
      }
      data-expanded={group ? group.expanded.has(id) : expanded}
      onPointerEnter={(event) => {
        if (group) group.expand(id);
        else setExpanded(true);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        if (!group) setExpanded(false);
        onPointerLeave?.(event);
      }}
    >
      {icon}
      <span className="inline-block max-w-0 -translate-x-[5px] overflow-hidden whitespace-nowrap opacity-0 [transition:max-width_.65s_cubic-bezier(.4,0,.2,1),opacity_.35s_ease,transform_.55s_cubic-bezier(.4,0,.2,1),margin-left_.65s_cubic-bezier(.4,0,.2,1)] group-data-[expanded=true]/expanding:ml-3 group-data-[expanded=true]/expanding:max-w-[180px] group-data-[expanded=true]/expanding:translate-x-0 group-data-[expanded=true]/expanding:opacity-100 group-data-[expanded=true]/expanding:[transition-delay:0s,.12s,0s,0s] group-focus-visible/expanding:ml-3 group-focus-visible/expanding:max-w-[180px] group-focus-visible/expanding:translate-x-0 group-focus-visible/expanding:opacity-100 group-focus-visible/expanding:[transition-delay:0s,.12s,0s,0s] motion-reduce:transition-none">
        {label}
      </span>
    </button>
  );
}
