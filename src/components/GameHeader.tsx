import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const GameHeader = ({ title, subtitle, showBackButton, onBack }: GameHeaderProps) => {
  return (
    <div className="bg-gradient-hero text-white py-8 px-6 rounded-2xl shadow-strong mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
      <div className="relative flex items-center justify-between">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/15 backdrop-blur-sm rounded-lg border-white/20"
          >
            ← Назад
          </Button>
        )}
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-1 text-white drop-shadow-lg">{title}</h1>
          {subtitle && (
            <p className="text-white/95 text-sm drop-shadow-md">{subtitle}</p>
          )}
        </div>
        {showBackButton && <div className="w-16" />}
      </div>
    </div>
  );
};