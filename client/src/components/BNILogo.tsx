import { cn } from "@/lib/utils";

interface BNILogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function BNILogo({ size = "md", className }: BNILogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/bni-logo.png" 
        alt="Bank Negara Indonesia" 
        className={sizeClasses[size]}
      />
      {size !== "sm" && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-brand-teal">BNI SDLC</span>
          <span className="text-xs text-muted-foreground">Approvals System</span>
        </div>
      )}
    </div>
  );
}