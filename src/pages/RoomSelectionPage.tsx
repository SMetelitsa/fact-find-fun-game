
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
    onJoinRoom(joinRoomId.trim());
  };

  const handleLeaveRoom = async (roomId: number) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUserId);

      if (error) throw error;
      
      loadUserRooms();
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
      <GameHeader title="Выбор комнаты" />
      <div className="container mx-auto px-4 py-8 space-y-6">
        
        {/* User's rooms */}
        {userRooms.length > 0 && (
          <GameCard>
            <h2 className="text-xl font-semibold mb-4">Ваши комнаты</h2>
            <div className="space-y-3">
              {userRooms.map((room) => (
                <div key={room.room_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{room.room_name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {room.room_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onSelectRoom(room.room_id.toString())}
                      size="sm"
                    >
                      Войти
                    </Button>
                    <Button 
                      onClick={() => handleLeaveRoom(room.room_id)}
                      variant="destructive"
                      size="sm"
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
          <h2 className="text-xl font-semibold mb-4">Создать комнату</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomName">Название комнаты</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Введите название комнаты"
              />
            </div>
            <Button onClick={handleCreateRoom} className="w-full">
              Создать комнату
            </Button>
          </div>
        </GameCard>

        {/* Join existing room */}
        <GameCard>
          <h2 className="text-xl font-semibold mb-4">Войти в комнату</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="joinRoomId">ID комнаты</Label>
              <Input
                id="joinRoomId"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Введите ID комнаты"
              />
            </div>
            <Button onClick={handleJoinRoom} className="w-full">
              Войти в комнату
            </Button>
          </div>
        </GameCard>
      </div>
    </div>
  );
};
