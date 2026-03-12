import nextwebLogo from "@/assets/nextweb-logo-new.png";

interface NWLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function NWLogo({ size = "md", showText = true }: NWLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-3">
      <img
        src={nextwebLogo}
        alt="NextWeb OS"
        className={`${sizeClasses[size]} rounded-lg object-contain`}
      />
      {showText && (
        <span className={`${textClasses[size]} font-bold text-primary-foreground`}>
          NextWeb OS
        </span>
      )}
    </div>
  );
}
