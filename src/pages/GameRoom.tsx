import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { PlayerList } from "@/components/PlayerList";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
  surname?: string;
  position?: string;
  hasEnteredFacts: boolean;
}

interface GameRoomProps {
  roomId: string;
  players: Player[];
  currentPlayer: {
    id: string;
    name: string;
    surname?: string;
    position?: string;
  };
  onBack: () => void;
  onFactsSubmitted: (facts: { fact1: string; fact2: string; fact3: string }) => void;
  onStartGuessing: () => void;
}

export const GameRoom = ({
  roomId,
  players,
  currentPlayer,
  onBack,
  onFactsSubmitted,
  onStartGuessing,
}: GameRoomProps) => {
  const [facts, setFacts] = useState({
    fact1: "",
    fact2: "",
    fact3: "",
  });
  const [factsSubmitted, setFactsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmitFacts = () => {
    if (!facts.fact1.trim() || !facts.fact2.trim() || !facts.fact3.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните все три факта",
        variant: "destructive",
      });
      return;
    }

    onFactsSubmitted(facts);
    setFactsSubmitted(true);
    toast({
      title: "Отлично!",
      description: "Ваши факты сохранены",
    });
  };

  const playersWithFacts = players.filter((p) => p.hasEnteredFacts);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <GameHeader
          title={`Комната ${roomId}`}
          subtitle="Игра «Угадай факт»"
          showBackButton
          onBack={onBack}
        />

        <div className="mb-6">
          <PlayerList
            players={playersWithFacts}
            title="Игроки, которые ввели факты сегодня"
          />
        </div>

        {!factsSubmitted ? (
          <GameCard>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Введите ваши факты
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Введите два правдивых факта и один ложный. Другие игроки будут
              пытаться угадать, какой из них ложный.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fact1">Факт 1 (правдивый)</Label>
                <Input
                  id="fact1"
                  placeholder="Например: Я умею играть на гитаре"
                  value={facts.fact1}
                  onChange={(e) =>
                    setFacts({ ...facts, fact1: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fact2">Факт 2 (правдивый)</Label>
                <Input
                  id="fact2"
                  placeholder="Например: Я побывал в 5 странах"
                  value={facts.fact2}
                  onChange={(e) =>
                    setFacts({ ...facts, fact2: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fact3">Факт 3 (ложный)</Label>
                <Input
                  id="fact3"
                  placeholder="Например: Я знаю 10 языков программирования"
                  value={facts.fact3}
                  onChange={(e) =>
                    setFacts({ ...facts, fact3: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <Button
                variant="success"
                size="lg"
                onClick={handleSubmitFacts}
                className="w-full mt-6"
              >
                Сохранить факты
              </Button>
            </div>
          </GameCard>
        ) : (
          <GameCard>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Ваши факты сохранены!
            </h2>
            <p className="text-muted-foreground mb-6">
              Теперь вы можете начать угадывать факты других игроков
            </p>
            <Button
              variant="game"
              size="lg"
              onClick={onStartGuessing}
              className="w-full"
              disabled={playersWithFacts.length === 0}
            >
              {playersWithFacts.length === 0
                ? "Ждем других игроков..."
                : "Начать угадывать"}
            </Button>
          </GameCard>
        )}
      </div>
    </div>
  );
};