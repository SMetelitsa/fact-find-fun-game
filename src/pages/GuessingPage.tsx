import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
  surname?: string;
  position?: string;
  facts: string[];
}

interface GuessingPageProps {
  roomId: string;
  players: Player[];
  onBack: () => void;
  onGuess: (playerId: string, selectedFact: string) => boolean;
  onFinish: () => void;
}

export const GuessingPage = ({
  roomId,
  players,
  onBack,
  onGuess,
  onFinish,
}: GuessingPageProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [guessedPlayers, setGuessedPlayers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handlePlayerSelect = (player: Player) => {
    if (guessedPlayers.has(player.id)) return;
    setSelectedPlayer(player);
  };

  const handleFactSelect = (fact: string) => {
    if (!selectedPlayer) return;

    const isCorrect = onGuess(selectedPlayer.id, fact);
    setGuessedPlayers(prev => new Set([...prev, selectedPlayer.id]));

    if (isCorrect) {
      toast({
        title: "Правильно!",
        description: "Вы угадали ложный факт!",
      });
    } else {
      toast({
        title: "Неправильно",
        description: "Это был правдивый факт",
        variant: "destructive",
      });
    }

    setSelectedPlayer(null);
  };

  const availablePlayers = players.filter(p => !guessedPlayers.has(p.id));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <GameHeader
          title={`Угадывание - Комната ${roomId}`}
          subtitle="Найдите ложные факты!"
          showBackButton
          onBack={onBack}
        />

        {!selectedPlayer ? (
          <>
            <GameCard className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Выберите игрока
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Нажмите на имя игрока, чтобы увидеть его факты
              </p>
              <div className="space-y-2">
                {availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    className="w-full p-4 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="font-medium text-foreground">
                      {player.name} {player.surname}
                    </div>
                    {player.position && (
                      <div className="text-sm text-muted-foreground">
                        {player.position}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {availablePlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Вы угадали факты всех игроков!
                </p>
              )}
            </GameCard>

            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={onFinish}
                className="w-full"
              >
                Закончить на сегодня
              </Button>
            </div>
          </>
        ) : (
          <GameCard>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Факты игрока {selectedPlayer.name} {selectedPlayer.surname}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Какой из этих фактов ложный?
            </p>
            <div className="space-y-3">
              {selectedPlayer.facts.map((fact, index) => (
                <button
                  key={index}
                  onClick={() => handleFactSelect(fact)}
                  className="w-full p-4 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="text-foreground">{fact}</div>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedPlayer(null)}
              className="w-full mt-4"
            >
              Назад к списку игроков
            </Button>
          </GameCard>
        )}
      </div>
    </div>
  );
};