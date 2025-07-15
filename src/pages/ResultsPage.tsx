import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTelegram } from "@/hooks/useTelegram";

interface ResultsPageProps {
  roomId: string;
  onBack: () => void;
}

interface PlayerGuess {
  player_name: string;
  chosen_fact: string;
  is_correct: boolean;
}

interface MyStats {
  total_guesses: number;
  correct_guesses: number;
  accuracy: number;
}

interface FactStats {
  fact: string;
  guesses: PlayerGuess[];
  total_guesses: number;
  correct_guesses: number;
}

export const ResultsPage = ({ roomId, onBack }: ResultsPageProps) => {
  const { user } = useTelegram();
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [factStats, setFactStats] = useState<FactStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, roomId]);

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch my guessing stats
      const { data: myGuesses, error: myGuessesError } = await supabase
        .from('game_stats')
        .select('is_correct')
        .eq('player_id', user.id)
        .eq('room_id', parseInt(roomId))
        .eq('date', new Date().toISOString().split('T')[0]);

      if (myGuessesError) throw myGuessesError;

      const totalGuesses = myGuesses?.length || 0;
      const correctGuesses = myGuesses?.filter(g => g.is_correct).length || 0;
      const accuracy = totalGuesses > 0 ? (correctGuesses / totalGuesses) * 100 : 0;

      setMyStats({
        total_guesses: totalGuesses,
        correct_guesses: correctGuesses,
        accuracy: Math.round(accuracy)
      });

      // Fetch my facts and who guessed them
      const { data: myFacts, error: factsError } = await supabase
        .from('facts')
        .select('fact1, fact2, fact3')
        .eq('id', user.id)
        .eq('room_id', parseInt(roomId))
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (factsError && factsError.code !== 'PGRST116') throw factsError;

      if (myFacts) {
        const facts = [myFacts.fact1, myFacts.fact2, myFacts.fact3];
        const factStatsData: FactStats[] = [];

        for (const fact of facts) {
          // Get all guesses for this fact
          const { data: guesses, error: guessesError } = await supabase
            .from('game_stats')
            .select('player_id, chosen_fact, is_correct')
            .eq('aim_id', user.id)
            .eq('room_id', parseInt(roomId))
            .eq('date', new Date().toISOString().split('T')[0])
            .eq('chosen_fact', fact);

          if (guessesError) throw guessesError;

          // Get player names separately
          const playerIds = guesses?.map(g => g.player_id) || [];
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', playerIds);

          if (profilesError) throw profilesError;

          const playerGuesses: PlayerGuess[] = guesses?.map(g => {
            const profile = profiles?.find(p => p.id === g.player_id);
            return {
              player_name: profile?.name || 'Unknown',
              chosen_fact: g.chosen_fact,
              is_correct: g.is_correct
            };
          }) || [];

          const totalGuessesForFact = playerGuesses.length;
          const correctGuessesForFact = playerGuesses.filter(g => g.is_correct).length;

          factStatsData.push({
            fact,
            guesses: playerGuesses,
            total_guesses: totalGuessesForFact,
            correct_guesses: correctGuessesForFact
          });
        }

        setFactStats(factStatsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <GameHeader
            title="Статистика"
            subtitle="Загрузка результатов..."
            showBackButton
            onBack={onBack}
          />
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <GameHeader
          title="Статистика"
          subtitle="Ваши результаты за сегодня"
          showBackButton
          onBack={onBack}
        />

        {/* My guessing stats */}
        {myStats && (
          <GameCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Мои угадывания
              </h2>
              <Badge variant={myStats.accuracy >= 70 ? "default" : "secondary"}>
                {myStats.accuracy}% точность
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{myStats.total_guesses}</div>
                <div className="text-sm text-muted-foreground">Всего попыток</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{myStats.correct_guesses}</div>
                <div className="text-sm text-muted-foreground">Правильных</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {myStats.total_guesses - myStats.correct_guesses}
                </div>
                <div className="text-sm text-muted-foreground">Неправильных</div>
              </div>
            </div>
          </GameCard>
        )}

        {/* Facts stats */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Как угадывали мои факты
          </h2>

          {factStats.length === 0 ? (
            <GameCard>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Никто пока не угадывал ваши факты
                </h3>
                <p className="text-muted-foreground">
                  Подождите, пока другие игроки попытаются угадать ваши факты
                </p>
              </div>
            </GameCard>
          ) : (
            factStats.map((factStat, index) => (
              <GameCard key={index}>
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-foreground font-medium flex-1">
                      {factStat.fact}
                    </p>
                    <Badge variant="outline">
                      {factStat.total_guesses} попыток
                    </Badge>
                  </div>
                  
                  {factStat.total_guesses > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        Угадали правильно: {factStat.correct_guesses} из {factStat.total_guesses}
                        ({Math.round((factStat.correct_guesses / factStat.total_guesses) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>

                {factStat.guesses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Кто угадывал:</h4>
                    {factStat.guesses.map((guess, guessIndex) => (
                      <div
                        key={guessIndex}
                        className={`flex items-center justify-between p-2 rounded ${
                          guess.is_correct ? 'bg-success/10' : 'bg-destructive/10'
                        }`}
                      >
                        <span className="text-sm font-medium">{guess.player_name}</span>
                        <Badge variant={guess.is_correct ? "default" : "destructive"}>
                          {guess.is_correct ? 'Угадал' : 'Не угадал'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </GameCard>
            ))
          )}
        </div>

        <div className="mt-8">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Вернуться к игре
          </Button>
        </div>
      </div>
    </div>
  );
};