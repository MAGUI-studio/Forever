import type { ComponentPropsWithoutRef } from "react";

export function WeddingInput({className = "", ...props}: ComponentPropsWithoutRef<"input">) {
  return <input className={"guest-input " + className} {...props}/>;
}

export function WeddingTextarea({className = "", ...props}: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={"guest-input " + className} {...props}/>;
}
