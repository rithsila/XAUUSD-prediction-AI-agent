import { CheckIcon } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

const Checkbox = ({ className, ...props }: CheckboxPrimitive.CheckboxProps) => (
  <CheckboxPrimitive.Root
    data-slot="checkbox"
    className={cn(
      "bg-background ring-offset-background focus-visible:ring-ring dark:bg-input/30 dark:data-[state=checked]:bg-accent dark:data-[state=indeterminate]:bg-accent aspect-square h-4 w-4 rounded-sm border border-input shadow-xs transition-shadow data-[state=checked]:border-primary data-[state=indeterminate]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary disabled:cursor-not-allowed disabled:opacity-50",
      "focus-ring",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("text-background")}>
      <CheckIcon className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

export { Checkbox };
