import { useState } from "react";
import { StartPage, PlayerData } from "./StartPage";
import { GameRoom } from "./GameRoom";
import { GuessingPage } from "./GuessingPage";

type GameState = "start" | "room" | "guessing" | "results";

interface Player {
  id: string;
  name: string;
  surname?: string;
  position?: string;
  hasEnteredFacts: boolean;
  facts?: string[];
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("start");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);

  // Mock data for demo
  const mockPlayers: Player[] = [
    {
      id: "1",
      name: "Анна",
      surname: "Петрова",
      position: "Дизайнер",
      hasEnteredFacts: true,
      facts: [
        "Я умею играть на пианино",
        "Я побывала в 12 странах",
        "У меня есть черный пояс по карате"
      ]
    },
    {
      id: "2",
      name: "Михаил",
      surname: "Сидоров",
      position: "Программист",
      hasEnteredFacts: true,
      facts: [
        "Я написал свою первую программу в 8 лет",
        "Я могу решить кубик Рубика за 30 секунд",
        "Я никогда не пил кофе"
      ]
    }
  ];

  const handleCreateRoom = (playerData: PlayerData) => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCurrentPlayer(playerData);
    setRoomId(newRoomId);
    setPlayers(mockPlayers); // In real app, this would be empty initially
    setGameState("room");
  };

  const handleJoinRoom = (playerData: PlayerData, roomId: string) => {
    setCurrentPlayer(playerData);
    setRoomId(roomId);
    setPlayers(mockPlayers); // In real app, load players from backend
    setGameState("room");
  };

  const handleFactsSubmitted = (facts: { fact1: string; fact2: string; fact3: string }) => {
    // In real app, save facts to backend
    console.log("Facts submitted:", facts);
  };

  const handleStartGuessing = () => {
    setGameState("guessing");
  };

  const handleGuess = (playerId: string, selectedFact: string): boolean => {
    // In real app, check with backend if guess is correct
    // For demo, randomly return true/false
    const isCorrect = Math.random() > 0.5;
    console.log("Guess:", { playerId, selectedFact, isCorrect });
    return isCorrect;
  };

  const handleBackToStart = () => {
    setGameState("start");
    setCurrentPlayer(null);
    setRoomId("");
    setPlayers([]);
  };

  const handleFinishGame = () => {
    // In real app, navigate to results page
    console.log("Game finished");
    handleBackToStart();
  };

  if (gameState === "start") {
    return (
      <StartPage
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  if (gameState === "room" && currentPlayer) {
    return (
      <GameRoom
        roomId={roomId}
        players={players}
        currentPlayer={{
          id: "current",
          name: currentPlayer.name,
          surname: currentPlayer.surname,
          position: currentPlayer.position,
        }}
        onBack={handleBackToStart}
        onFactsSubmitted={handleFactsSubmitted}
        onStartGuessing={handleStartGuessing}
      />
    );
  }

  if (gameState === "guessing") {
    return (
      <GuessingPage
        roomId={roomId}
        players={players.map(p => ({
          ...p,
          facts: p.facts || []
        }))}
        onBack={() => setGameState("room")}
        onGuess={handleGuess}
        onFinish={handleFinishGame}
      />
    );
  }

  return null;
};

export default Index;
