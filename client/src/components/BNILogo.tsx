interface BNILogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BNILogo({ className = "", size = "md" }: BNILogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} aspect-square bg-brand-teal rounded-md flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">BNI</span>
      </div>
      <span className="font-semibold text-foreground">SDLC Approvals</span>
    </div>
  );
}
