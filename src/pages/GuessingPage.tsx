
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTelegram } from "@/hooks/useTelegram";

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
  onGuess: (playerId: string, selectedFact: string) => Promise<boolean>;
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
  const [alreadyGuessedToday, setAlreadyGuessedToday] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useTelegram();

  useEffect(() => {
    loadAlreadyGuessedPlayers();
  }, [roomId, user?.id]);

  const loadAlreadyGuessedPlayers = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingGuesses, error } = await supabase
        .from('game_stats')
        .select('aim_id')
        .eq('player_id', user.id)
        .eq('room_id', parseInt(roomId))
        .eq('date', today);

      if (error) throw error;

      const alreadyGuessed = new Set(existingGuesses?.map(g => g.aim_id) || []);
      setAlreadyGuessedToday(alreadyGuessed);
    } catch (error) {
      console.error('Error loading already guessed players:', error);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    if (guessedPlayers.has(player.id) || alreadyGuessedToday.has(player.id)) return;
    setSelectedPlayer(player);
  };

  const handleFactSelect = async (fact: string) => {
    if (!selectedPlayer) return;

    const isCorrect = await onGuess(selectedPlayer.id, fact);
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

  const availablePlayers = players.filter(p => 
    !guessedPlayers.has(p.id) && !alreadyGuessedToday.has(p.id)
  );

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
                
                {/* Show already guessed players */}
                {players.filter(p => alreadyGuessedToday.has(p.id)).map((player) => (
                  <div
                    key={player.id}
                    className="w-full p-4 text-left bg-muted/50 rounded-lg opacity-50 cursor-not-allowed"
                  >
                    <div className="font-medium text-foreground">
                      {player.name} {player.surname}
                    </div>
                    {player.position && (
                      <div className="text-sm text-muted-foreground">
                        {player.position}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Уже угадывали сегодня
                    </div>
                  </div>
                ))}
              </div>
              {availablePlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Вы угадали факты всех доступных игроков!
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
