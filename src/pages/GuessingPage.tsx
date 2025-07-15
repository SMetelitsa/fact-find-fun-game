
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
        className: "bg-green-500 text-white border-green-600",
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
          title="Угадывание"
          subtitle="Найдите ложные факты других игроков"
          showBackButton
          onBack={onBack}
        />

        {!selectedPlayer ? (
          <>
            <GameCard className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Выберите игрока
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Выберите игрока, чтобы угадать его ложный факт
              </p>
              <div className="space-y-3">
                {availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    className="w-full p-4 text-left bg-muted/40 rounded-xl hover:bg-gradient-primary hover:text-primary-foreground transition-all duration-200 transform hover:scale-[1.02] shadow-soft hover:shadow-medium"
                  >
                    <div className="font-semibold">
                      {player.name} {player.surname}
                    </div>
                    {player.position && (
                      <div className="text-sm opacity-80 mt-1">
                        {player.position}
                      </div>
                    )}
                  </button>
                ))}
                
                {/* Show already guessed players */}
                {players.filter(p => alreadyGuessedToday.has(p.id)).map((player) => (
                  <div
                    key={player.id}
                    className="w-full p-4 text-left bg-muted/20 rounded-xl opacity-50 cursor-not-allowed border border-border/30"
                  >
                    <div className="font-medium text-foreground">
                      {player.name} {player.surname}
                    </div>
                    {player.position && (
                      <div className="text-sm text-muted-foreground">
                        {player.position}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                      ✓ Уже угадывали сегодня
                    </div>
                  </div>
                ))}
              </div>
              {availablePlayers.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-foreground font-medium mb-2">Отлично!</p>
                  <p className="text-muted-foreground text-sm">
                    Вы угадали факты всех доступных игроков!
                  </p>
                </div>
              )}
            </GameCard>

            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={onFinish}
                className="w-full rounded-xl"
              >
                Завершить угадывание
              </Button>
            </div>
          </>
        ) : (
          <GameCard>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Факты {selectedPlayer.name} {selectedPlayer.surname}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Какой из фактов ложный? Выберите один из вариантов:
            </p>
            <div className="space-y-3">
              {selectedPlayer.facts.map((fact, index) => (
                <button
                  key={index}
                  onClick={() => handleFactSelect(fact)}
                  className="w-full p-5 text-left bg-muted/40 rounded-xl hover:bg-gradient-success hover:text-success-foreground transition-all duration-200 transform hover:scale-[1.02] shadow-soft hover:shadow-medium border border-border/30"
                >
                  <div className="font-medium leading-relaxed">{fact}</div>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedPlayer(null)}
              className="w-full mt-6 rounded-xl"
            >
              ← Назад к списку игроков
            </Button>
          </GameCard>
        )}
      </div>
    </div>
  );
};
