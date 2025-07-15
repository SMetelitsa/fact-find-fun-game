import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const GameHeader = ({ title, subtitle, showBackButton, onBack }: GameHeaderProps) => {
  return (
    <div className="bg-gradient-hero text-primary-foreground py-8 px-6 rounded-2xl shadow-strong mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
      <div className="relative flex items-center justify-between">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/15 backdrop-blur-sm rounded-lg"
          >
            ← Назад
          </Button>
        )}
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-1">{title}</h1>
          {subtitle && (
            <p className="text-primary-foreground/90 text-sm">{subtitle}</p>
          )}
        </div>
        {showBackButton && <div className="w-16" />}
      </div>
    </div>
  );
};