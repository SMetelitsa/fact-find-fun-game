import { useState, useEffect } from "react";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTelegram } from "@/hooks/useTelegram";

interface RegistrationPageProps {
  onRegistration: (playerData: { name: string; surname?: string; position?: string }) => void;
}

interface PlayerData {
  name: string;
  surname?: string;
  position?: string;
}

export const RegistrationPage = ({ onRegistration }: RegistrationPageProps) => {
  const [playerData, setPlayerData] = useState<PlayerData>({
    name: "",
    surname: "",
    position: "",
  });

  const { user: telegramUser } = useTelegram();

  useEffect(() => {
    if (telegramUser) {
      setPlayerData({
        name: telegramUser.firstName || "",
        surname: telegramUser.lastName || "",
        position: "",
      });
    }
  }, [telegramUser]);

  const handleRegistration = () => {
    if (!playerData.name.trim()) {
      alert("Пожалуйста, введите ваше имя");
      return;
    }
    onRegistration(playerData);
  };

  return (
    <div className="min-h-screen bg-background">
      <GameHeader title="Регистрация" />
      <div className="container mx-auto px-4 py-8">
        <GameCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-6">Добро пожаловать!</h2>
            <div>
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                value={playerData.name}
                onChange={(e) =>
                  setPlayerData({ ...playerData, name: e.target.value })
                }
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <Label htmlFor="surname">Фамилия</Label>
              <Input
                id="surname"
                value={playerData.surname}
                onChange={(e) =>
                  setPlayerData({ ...playerData, surname: e.target.value })
                }
                placeholder="Введите вашу фамилию"
              />
            </div>

            <div>
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                value={playerData.position}
                onChange={(e) =>
                  setPlayerData({ ...playerData, position: e.target.value })
                }
                placeholder="Введите вашу должность"
              />
            </div>

            <Button
              onClick={handleRegistration}
              className="w-full"
            >
              Зарегистрироваться
            </Button>
          </div>
        </GameCard>
      </div>
    </div>
  );
};