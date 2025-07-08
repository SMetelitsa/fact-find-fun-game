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
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      {players.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          Пока никто не ввел факты
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div>
                <div className="font-medium text-foreground">
                  {player.name} {player.surname}
                </div>
                {player.position && (
                  <div className="text-sm text-muted-foreground">
                    {player.position}
                  </div>
                )}
              </div>
              {player.hasEnteredFacts && (
                <div className="w-3 h-3 bg-success rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </GameCard>
  );
};