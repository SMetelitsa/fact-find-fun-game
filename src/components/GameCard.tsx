import { ReactNode } from "react";

interface GameCardProps {
  children: ReactNode;
  className?: string;
}

export const GameCard = ({ children, className = "" }: GameCardProps) => {
  return (
    <div className={`bg-gradient-card rounded-xl p-6 shadow-card hover:shadow-medium transition-all duration-200 border border-border/50 ${className}`}>
      {children}
    </div>
  );
};