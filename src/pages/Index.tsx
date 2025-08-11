
import { useState, useEffect } from "react";
import { RegistrationPage } from "./RegistrationPage";
import { RoomSelectionPage } from "./RoomSelectionPage";
import { ProfileSettingsPage } from "./ProfileSettingsPage";
import { GameRoom } from "./GameRoom";
import { GuessingPage } from "./GuessingPage";
import { ResultsPage } from "./ResultsPage";
import { useTelegram } from "@/hooks/useTelegram";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type GameState = "registration" | "roomSelection" | "profileSettings" | "room" | "guessing" | "results";

interface PlayerData {
  name: string;
  surname?: string;
  position?: string;
}

interface Player {
  id: string;
  name: string;
  surname?: string;
  position?: string;
  hasEnteredFacts: boolean;
  facts?: string[];
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>("registration");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const { user, isReady } = useTelegram();
  const { toast } = useToast();

  console.log('Current game state:', gameState, 'Current player:', currentPlayer);

  useEffect(() => {
    if (isReady && user) {
      checkUserRegistration(user);
    }
  }, [isReady, user]);

  const checkUserRegistration = async (telegramUser: any) => {
    try {
      // Check if user profile exists and is registered
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', telegramUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profile && profile.is_registered) {
        // User is registered, check for room memberships
        setCurrentPlayer({
          name: profile.name,
          surname: profile.surname || undefined,
          position: profile.position || undefined,
        });

        // Check if user has active room memberships
        const { data: memberships, error: memberError } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', telegramUser.id)
          .eq('is_active', true);

        if (memberError) throw memberError;

        if (memberships && memberships.length > 0) {
          setGameState("roomSelection");
        } else {
          setGameState("roomSelection");
        }
      } else {
        // User is not registered, stay on registration page
        setGameState("registration");
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
      setGameState("registration");
    }
  };

  const loadPlayers = async (roomId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get facts for today in this room
      const { data: factsData, error: factsError } = await supabase
        .from('facts')
        .select('id, fact1, fact2, fact3')
        .eq('room_id', parseInt(roomId))
        .eq('date', today);

      if (factsError) throw factsError;

      // Get profiles for all players who submitted facts
      const playerIds = factsData?.map(fact => fact.id) || [];
      
      if (playerIds.length === 0) {
        setPlayers([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, surname, position')
        .in('id', playerIds);

      if (profilesError) throw profilesError;

      // Combine facts and profiles data
      const playersWithFacts: Player[] = factsData?.map(fact => {
        const profile = profilesData?.find(p => p.id === fact.id);
        return {
          id: fact.id,
          name: profile?.name || 'Unknown',
          surname: profile?.surname,
          position: profile?.position,
          hasEnteredFacts: true,
          facts: [fact.fact1, fact.fact2, fact.fact3]
        };
      }) || [];

      console.log('Loaded players with facts:', playersWithFacts);
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

  const handleRegistration = async (playerData: PlayerData) => {
    if (!user?.id) return;
    
    try {
      // Save/update user profile and mark as registered
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: playerData.name,
          surname: playerData.surname || null,
          position: playerData.position || null,
          is_registered: true,
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      setCurrentPlayer(playerData);
      
      // Check for room ID in URL (invite link)
      const urlParams = new URLSearchParams(window.location.search);
      const inviteRoomId = urlParams.get('room');
      if (inviteRoomId) {
        await handleJoinRoom(inviteRoomId);
      } else {
        setGameState("roomSelection");
      }
    } catch (error) {
      console.error('Error registering user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось зарегистрироваться",
        variant: "destructive"
      });
    }
  };

  const handleCreateRoom = async (roomName: string) => {
    if (!user?.id) return;
    
    try {
      const newRoomId = Math.floor(Math.random() * 900000) + 100000; // 6-digit room ID
      
      // Create room in database
      const { error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: newRoomId,
          created_by: user.id,
          name: roomName,
        });

      if (roomError) throw roomError;

      // Add creator to room members
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: newRoomId,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      // Generate invite link
      const inviteLink = `${window.location.origin}?room=${newRoomId}`;
      
      setRoomId(newRoomId.toString());
      setRoomName(roomName);
      await loadPlayers(newRoomId.toString());
      setGameState("room");

      // Show invite link to user
      navigator.clipboard.writeText(inviteLink).then(() => {
        toast({
          title: "Комната создана!",
          description: `Ссылка для приглашения скопирована: ${inviteLink}`,
        });
      }).catch(() => {
        toast({
          title: "Комната создана!",
          description: `Поделитесь ссылкой: ${inviteLink}`,
        });
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать комнату",
        variant: "destructive"
      });
    }
  };

  const handleJoinRoom = async (roomId: string) => {
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

      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', parseInt(roomId))
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (!existingMember) {
        // Add user to room members
        const { error: memberError } = await supabase
          .from('room_members')
          .insert({
            room_id: parseInt(roomId),
            user_id: user.id,
            is_active: true,
          });

        if (memberError) throw memberError;
      }

      setRoomId(roomId);
      setRoomName(room.name);
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

  const handleSelectRoom = async (roomId: string) => {
    await handleJoinRoom(roomId);
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
      
      // Insert new facts (each day gets a new entry)
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
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Facts saved successfully:', data);
      
      toast({
        title: "Успешно!",
        description: "Ваши факты сохранены",
      });

      // Reload players after submitting facts
      await loadPlayers(roomId);
      
    } catch (error: any) {
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
      const today = new Date().toISOString().split('T')[0];

      // Check if user has already guessed for this player today
      const { data: existingGuess, error: checkError } = await supabase
        .from('game_stats')
        .select('id')
        .eq('player_id', user.id)
        .eq('aim_id', playerId)
        .eq('room_id', parseInt(roomId))
        .eq('date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingGuess) {
        toast({
          title: "Ошибка",
          description: "Вы уже угадывали факт этого игрока сегодня",
          variant: "destructive"
        });
        return false;
      }

      // Get the target player's facts to check if the guess is correct
      const { data: targetFacts, error: factsError } = await supabase
        .from('facts')
        .select('fact3')
        .eq('id', playerId)
        .eq('room_id', parseInt(roomId))
        .eq('date', today)
        .single();

      if (factsError) throw factsError;

      // The third fact (fact3) is the FALSE one, so if user selected it, they are correct
      const isCorrect = selectedFact === targetFacts.fact3;

      // Save the guess result
      const { error: guessError } = await supabase
        .from('game_stats')
        .insert({
          player_id: user.id,
          aim_id: playerId,
          chosen_fact: selectedFact,
          is_correct: isCorrect,
          room_id: parseInt(roomId),
          date: today
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

  const handleChangeRoom = () => {
    setGameState("roomSelection");
    setRoomId("");
    setRoomName("");
    setPlayers([]);
  };

  const handleFinishGame = () => {
    setGameState("results");
  };

  const handleShowResults = () => {
    setGameState("results");
  };

  if (gameState === "registration") {
    return (
      <RegistrationPage
        onRegistration={handleRegistration}
      />
    );
  }

  if (gameState === "roomSelection" && currentPlayer) {
    return (
      <RoomSelectionPage
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSelectRoom={handleSelectRoom}
        currentUserId={user?.id || ""}
        onOpenProfileSettings={() => {
          alert(`Переходим в настройки профиля. User ID: ${user?.id}`);
          setGameState("profileSettings");
        }}
      />
    );
  }

  if (gameState === "profileSettings") {
    return (
      <ProfileSettingsPage
        onBack={() => setGameState("roomSelection")}
        currentUserId={user?.id || ""}
      />
    );
  }

  if (gameState === "room" && currentPlayer) {
    return (
      <GameRoom
        roomId={roomId}
        roomName={roomName}
        players={players}
        currentPlayer={{
          id: "current",
          name: currentPlayer.name,
          surname: currentPlayer.surname,
          position: currentPlayer.position,
        }}
        onBack={handleChangeRoom}
        onFactsSubmitted={handleFactsSubmitted}
        onStartGuessing={handleStartGuessing}
      />
    );
  }

  if (gameState === "guessing") {
    // Filter out current player and add shuffled facts
    const otherPlayers = players
      .filter(p => p.id !== user?.id)
      .map(p => ({
        ...p,
        facts: p.facts ? [...p.facts].sort(() => Math.random() - 0.5) : []
      }));

    return (
      <GuessingPage
        roomId={roomId}
        players={otherPlayers}
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
        onBack={handleChangeRoom}
      />
    );
  }

  return null;
};

export default Index;
