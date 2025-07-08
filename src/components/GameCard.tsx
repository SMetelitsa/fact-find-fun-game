import { ReactNode } from "react";

interface GameCardProps {
  children: ReactNode;
  className?: string;
}

export const GameCard = ({ children, className = "" }: GameCardProps) => {
  return (
    <div className={`bg-gradient-card rounded-lg p-6 shadow-soft hover:shadow-medium transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
};