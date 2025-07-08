import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { useToast } from "@/hooks/use-toast";

interface StartPageProps {
  onCreateRoom: (playerData: PlayerData) => void;
  onJoinRoom: (playerData: PlayerData, roomId: string) => void;
}

export interface PlayerData {
  name: string;
  surname?: string;
  position?: string;
}

export const StartPage = ({ onCreateRoom, onJoinRoom }: StartPageProps) => {
  const [playerData, setPlayerData] = useState<PlayerData>({
    name: "",
    surname: "",
    position: "",
  });
  const [roomId, setRoomId] = useState("");
  const { toast } = useToast();

  const handleCreateRoom = () => {
    if (!playerData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя для продолжения",
        variant: "destructive",
      });
      return;
    }
    onCreateRoom(playerData);
  };

  const handleJoinRoom = () => {
    if (!playerData.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя для продолжения",
        variant: "destructive",
      });
      return;
    }
    if (!roomId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID комнаты",
        variant: "destructive",
      });
      return;
    }
    onJoinRoom(playerData, roomId);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <GameHeader
          title="Угадай факт"
          subtitle="Игра с друзьями в одном клике"
        />

        <GameCard className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Ваши данные
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                placeholder="Введите ваше имя"
                value={playerData.name}
                onChange={(e) =>
                  setPlayerData({ ...playerData, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="surname">Фамилия</Label>
              <Input
                id="surname"
                placeholder="Введите фамилию (необязательно)"
                value={playerData.surname}
                onChange={(e) =>
                  setPlayerData({ ...playerData, surname: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                placeholder="Введите должность (необязательно)"
                value={playerData.position}
                onChange={(e) =>
                  setPlayerData({ ...playerData, position: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
        </GameCard>

        <GameCard className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Создать новую игру
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Создайте комнату и получите ссылку для приглашения друзей
          </p>
          <Button
            variant="game"
            size="lg"
            onClick={handleCreateRoom}
            className="w-full"
          >
            Создать комнату
          </Button>
        </GameCard>

        <GameCard>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Присоединиться к игре
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomId">ID комнаты</Label>
              <Input
                id="roomId"
                placeholder="Введите ID комнаты"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={handleJoinRoom}
              className="w-full"
            >
              Войти в комнату
            </Button>
          </div>
        </GameCard>
      </div>
    </div>
  );
};