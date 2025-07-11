import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const GameHeader = ({ title, subtitle, showBackButton, onBack }: GameHeaderProps) => {
  return (
    <div className="bg-gradient-primary text-primary-foreground py-6 px-4 rounded-lg shadow-medium mb-6">
      <div className="flex items-center justify-between">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/20"
          >
            ← Сменить комнату
          </Button>
        )}
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-primary-foreground/80 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {showBackButton && <div className="w-16" />}
      </div>
    </div>
  );
};