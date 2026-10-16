import type { MotionValue } from "framer-motion";

export type TemplateOrnamentsProps = {
  disableMotion?: boolean;
  progress?: MotionValue<number>;
  variant?: "botanical" | "floral" | "hearts" | "vows" | "venue";
  tone?: "olive" | "paper" | "photo";
  venue?: boolean;
};
