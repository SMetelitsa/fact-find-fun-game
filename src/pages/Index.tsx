import { useState, useEffect } from "react";
import { StartPage, PlayerData } from "./StartPage";
import { GameRoom } from "./GameRoom";
import { GuessingPage } from "./GuessingPage";
import { ResultsPage } from "./ResultsPage";
import { useTelegram } from "@/hooks/useTelegram";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { user, isReady } = useTelegram();
  const { toast } = useToast();

  useEffect(() => {
    if (isReady && user) {
      // Save/update user profile in database
      saveUserProfile(user);
    }
  }, [isReady, user]);

  const saveUserProfile = async (telegramUser: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: telegramUser.id,
          name: telegramUser.firstName,
          surname: telegramUser.lastName || null,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const loadPlayers = async (roomId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: factsData, error } = await supabase
        .from('facts')
        .select(`
          id,
          fact1,
          fact2,
          fact3,
          profiles!facts_id_fkey(name, surname, position)
        `)
        .eq('room_id', parseInt(roomId))
        .eq('date', today);

      if (error) throw error;

      const playersWithFacts: Player[] = factsData?.map(fact => ({
        id: fact.id,
        name: (fact.profiles as any)?.name || 'Unknown',
        surname: (fact.profiles as any)?.surname,
        position: (fact.profiles as any)?.position,
        hasEnteredFacts: true,
        facts: [fact.fact1, fact.fact2, fact.fact3]
      })) || [];

      setPlayers(playersWithFacts);
    } catch (error) {
      console.error('Error loading players:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список игроков",
        variant: "destructive"
      });
    }
  };

  const handleCreateRoom = async (playerData: PlayerData) => {
    if (!user?.id) return;
    
    const newRoomId = Math.floor(Math.random() * 900000) + 100000; // 6-digit room ID
    setCurrentPlayer(playerData);
    setRoomId(newRoomId.toString());
    await loadPlayers(newRoomId.toString());
    setGameState("room");
  };

  const handleJoinRoom = async (playerData: PlayerData, roomId: string) => {
    if (!user?.id) return;
    
    setCurrentPlayer(playerData);
    setRoomId(roomId);
    await loadPlayers(roomId);
    setGameState("room");
  };

  const handleFactsSubmitted = async (facts: { fact1: string; fact2: string; fact3: string }) => {
    if (!user?.id || !roomId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('facts')
        .upsert({
          id: user.id,
          fact1: facts.fact1,
          fact2: facts.fact2,
          fact3: facts.fact3,
          room_id: parseInt(roomId),
          date: today
        });

      if (error) throw error;

      // Reload players after submitting facts
      await loadPlayers(roomId);
      
      toast({
        title: "Успешно!",
        description: "Ваши факты сохранены",
      });
    } catch (error) {
      console.error('Error saving facts:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить факты",
        variant: "destructive"
      });
    }
  };

  const handleStartGuessing = () => {
    setGameState("guessing");
  };

  const handleGuess = async (playerId: string, selectedFact: string): Promise<boolean> => {
    if (!user?.id || !roomId) return false;

    try {
      // Get the target player's facts to check if the guess is correct
      const { data: targetFacts, error: factsError } = await supabase
        .from('facts')
        .select('fact3')
        .eq('id', playerId)
        .eq('room_id', parseInt(roomId))
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (factsError) throw factsError;

      const isCorrect = selectedFact === targetFacts.fact3;

      // Save the guess result
      const { error: guessError } = await supabase
        .from('game_stats')
        .upsert({
          player_id: user.id,
          aim_id: playerId,
          chosen_fact: selectedFact,
          is_correct: isCorrect,
          room_id: parseInt(roomId),
          date: new Date().toISOString().split('T')[0]
        });

      if (guessError) throw guessError;

      return isCorrect;
    } catch (error) {
      console.error('Error saving guess:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить угадывание",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleBackToStart = () => {
    setGameState("start");
    setCurrentPlayer(null);
    setRoomId("");
    setPlayers([]);
  };

  const handleFinishGame = () => {
    setGameState("results");
  };

  const handleShowResults = () => {
    setGameState("results");
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

  if (gameState === "results") {
    return (
      <ResultsPage
        roomId={roomId}
        onBack={handleBackToStart}
      />
    );
  }

  return null;
};

export default Index;
