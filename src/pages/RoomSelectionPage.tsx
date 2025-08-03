
import { useState, useEffect } from "react";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTelegram } from "@/hooks/useTelegram";

interface RoomSelectionPageProps {
  onCreateRoom: (roomName: string) => void;
  onJoinRoom: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
  currentUserId: string;
}

interface UserRoom {
  room_id: number;
  room_name: string;
  is_active: boolean;
}

export const RoomSelectionPage = ({ onCreateRoom, onJoinRoom, onSelectRoom, currentUserId }: RoomSelectionPageProps) => {
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: telegramUser } = useTelegram();

  useEffect(() => {
    loadUserRooms();
    
    // Check for room ID in URL parameters (invite link)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteRoomId = urlParams.get('room');
    if (inviteRoomId) {
      setJoinRoomId(inviteRoomId);
    }
  }, [currentUserId]);

  // Добавляем новый useEffect здесь
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('ID аутентифицированного пользователя (auth.uid):', user?.id, 'ID текущего пользователя из Telegram:', currentUserId);
    };
    checkAuth();
  }, [currentUserId]);
  
  const loadUserRooms = async () => {
    try {
      // Get room memberships
      const { data: memberships, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setUserRooms([]);
        setLoading(false);
        return;
      }

      const roomIds = memberships.map(m => m.room_id);

      // Get room details
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, is_active')
        .in('id', roomIds)
        .eq('is_active', true);

      if (roomsError) throw roomsError;

      const rooms = roomsData.map(room => ({
        room_id: room.id,
        room_name: room.name,
        is_active: room.is_active
      }));

      setUserRooms(rooms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user rooms:', error);
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert("Пожалуйста, введите название комнаты");
      return;
    }
    onCreateRoom(roomName.trim());
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      alert("Пожалуйста, введите ID комнаты");
      return;
    }
    
    // First try to reactivate existing membership
    reactivateRoomMembership(joinRoomId.trim()).then(() => {
      onJoinRoom(joinRoomId.trim());
    });
  };

  const reactivateRoomMembership = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_active: true })
        .eq('room_id', parseInt(roomId))
        .eq('user_id', currentUserId);

      if (error) {
        // If update fails (no existing record), the main join logic will create a new one
        console.log('No existing membership to reactivate');
      }
    } catch (error) {
      console.error('Error reactivating membership:', error);
    }
  };

  const handleLeaveRoom = async (roomId: number) => {
    console.log('Leaving room:', roomId, 'User:', currentUserId);
    
    try {
      // Use RPC function to bypass RLS and update with telegram user ID
      const { data, error } = await (supabase as any).rpc('leave_room', {
        p_room_id: roomId,
        p_user_id: currentUserId
      });

      console.log('Leave room RPC result:', { data, error });

      if (error) throw error;
      
      // Refresh the list to remove the inactive room
      await loadUserRooms();
      alert('Вы покинули комнату');
    } catch (error) {
      console.error('Error leaving room:', error);
      alert('Ошибка при выходе из комнаты');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GameHeader title="Загрузка..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4">
        <GameHeader title="Выбор комнаты" subtitle="Присоединитесь к игре или создайте новую комнату" />
        <div className="space-y-6">
          
          {/* User's rooms */}
          {userRooms.length > 0 && (
            <GameCard>
              <h2 className="text-xl font-semibold mb-6 text-foreground">Ваши комнаты</h2>
              <div className="space-y-3">
                {userRooms.map((room) => (
                  <div key={room.room_id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-foreground">{room.room_name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {room.room_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => onSelectRoom(room.room_id.toString())}
                        size="sm"
                        variant="game"
                      >
                        Войти
                      </Button>
                      <Button 
                        onClick={() => handleLeaveRoom(room.room_id)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Покинуть
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GameCard>
          )}

          {/* Create new room */}
          <GameCard>
            <h2 className="text-xl font-semibold mb-6 text-foreground">Создать комнату</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roomName" className="text-sm font-medium text-foreground">Название комнаты</Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Введите название комнаты"
                  className="mt-2 border-border/60 focus:border-primary/60 rounded-lg"
                />
              </div>
              <Button onClick={handleCreateRoom} variant="hero" size="lg" className="w-full">
                Создать комнату
              </Button>
            </div>
          </GameCard>

          {/* Join existing room */}
          <GameCard>
            <h2 className="text-xl font-semibold mb-6 text-foreground">Войти в комнату</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="joinRoomId" className="text-sm font-medium text-foreground">ID комнаты</Label>
                <Input
                  id="joinRoomId"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Введите ID комнаты"
                  className="mt-2 border-border/60 focus:border-primary/60 rounded-lg"
                />
              </div>
              <Button onClick={handleJoinRoom} variant="game" size="lg" className="w-full">
                Войти в комнату
              </Button>
            </div>
          </GameCard>
        </div>
      </div>
    </div>
  );
};
