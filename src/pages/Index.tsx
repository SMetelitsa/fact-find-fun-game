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
      // Save/update user profile and check for existing room
      saveUserProfileAndCheckRoom(user);
    }
  }, [isReady, user]);

  const saveUserProfileAndCheckRoom = async (telegramUser: any) => {
    try {
      // Save/update user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: telegramUser.id,
          name: telegramUser.firstName,
          surname: telegramUser.lastName || null,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) throw profileError;

      // Check if user has a current room and auto-join
      if (profile?.current_room_id) {
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', profile.current_room_id)
          .eq('is_active', true)
          .single();

        if (!roomError && room) {
          setCurrentPlayer({
            name: telegramUser.firstName,
            surname: telegramUser.lastName || undefined,
            position: profile.position || undefined,
          });
          setRoomId(room.id.toString());
          await loadPlayers(room.id.toString());
          setGameState("room");
        }
      }
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
    
    try {
      const newRoomId = Math.floor(Math.random() * 900000) + 100000; // 6-digit room ID
      
      // Create room in database
      const { error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: newRoomId,
          created_by: user.id,
        });

      if (roomError) throw roomError;

      // Update user's current room
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_room_id: newRoomId })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setCurrentPlayer(playerData);
      setRoomId(newRoomId.toString());
      await loadPlayers(newRoomId.toString());
      setGameState("room");
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать комнату",
        variant: "destructive"
      });
    }
  };

  const handleJoinRoom = async (playerData: PlayerData, roomId: string) => {
    if (!user?.id) return;
    
    try {
      // Check if room exists and is active
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', parseInt(roomId))
        .eq('is_active', true)
        .single();

      if (roomError || !room) {
        toast({
          title: "Ошибка",
          description: "Комната не найдена или неактивна",
          variant: "destructive"
        });
        return;
      }

      // Update user's current room
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_room_id: parseInt(roomId) })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setCurrentPlayer(playerData);
      setRoomId(roomId);
      await loadPlayers(roomId);
      setGameState("room");
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось войти в комнату",
        variant: "destructive"
      });
    }
  };

  const handleFactsSubmitted = async (facts: { fact1: string; fact2: string; fact3: string }) => {
    if (!user?.id || !roomId) {
      console.error('Missing user ID or room ID:', { userId: user?.id, roomId });
      toast({
        title: "Ошибка",
        description: "Отсутствует ID пользователя или комнаты",
        variant: "destructive"
      });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Attempting to save facts:', { userId: user.id, roomId, facts, date: today });
      
      // Insert new facts (no upsert to preserve history)
      const { data, error } = await supabase
        .from('facts')
        .insert({
          id: user.id,
          fact1: facts.fact1,
          fact2: facts.fact2,
          fact3: facts.fact3,
          room_id: parseInt(roomId),
          date: today
        })
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Facts saved successfully:', data);

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
        description: `Не удалось сохранить факты: ${error.message || 'Неизвестная ошибка'}`,
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

  const handleBackToStart = async () => {
    if (user?.id) {
      // Clear user's current room
      await supabase
        .from('profiles')
        .update({ current_room_id: null })
        .eq('id', user.id);
    }
    
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
