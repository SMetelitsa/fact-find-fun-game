import { GameCard } from "./GameCard";

interface Player {
  id: string;
  name: string;
  surname?: string;
  position?: string;
  hasEnteredFacts: boolean;
}

interface PlayerListProps {
  players: Player[];
  title: string;
}

export const PlayerList = ({ players, title }: PlayerListProps) => {
  return (
    <GameCard>
      <h3 className="text-lg font-semibold text-foreground mb-6">{title}</h3>
      {players.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-muted-foreground font-medium">
            Пока никто не ввел факты
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 bg-muted/40 rounded-xl hover:bg-muted/60 transition-all duration-200 border border-border/30"
            >
              <div>
                <div className="font-semibold text-foreground">
                  {player.name} {player.surname}
                </div>
                {player.position && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {player.position}
                  </div>
                )}
              </div>
              {player.hasEnteredFacts && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-success font-medium">Готов</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </GameCard>
  );
};