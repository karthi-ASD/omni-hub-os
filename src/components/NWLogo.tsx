import nextwebLogo from "@/assets/nextweb-logo.png";

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
        <span className={`${textClasses[size]} font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent`}>
          NextWeb OS
        </span>
      )}
    </div>
  );
}
