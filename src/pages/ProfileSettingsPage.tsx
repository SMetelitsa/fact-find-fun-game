import { useState, useEffect } from "react";
import { GameHeader } from "@/components/GameHeader";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTelegram } from "@/hooks/useTelegram";
import { useToast } from "@/hooks/use-toast";

interface ProfileSettingsPageProps {
  onBack: () => void;
  currentUserId: string;
}

interface UserProfile {
  name: string;
  surname: string | null;
  position: string | null;
}

export const ProfileSettingsPage = ({ onBack, currentUserId }: ProfileSettingsPageProps) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    surname: "",
    position: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('ProfileSettingsPage mounted, currentUserId:', currentUserId);
    loadProfile();
  }, [currentUserId]);

  const loadProfile = async () => {
    console.log('loadProfile called, currentUserId:', currentUserId);
    
    if (!currentUserId) {
      console.log('No currentUserId, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching profile from supabase for ID:', currentUserId);
      const { data, error } = await supabase
        .from('profiles')
        .select('name, surname, position')
        .eq('id', currentUserId)
        .single();

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      if (data) {
        const profileData = {
          name: data.name || "",
          surname: data.surname || "",
          position: data.position || ""
        };
        console.log('Setting profile data:', profileData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профиль",
        variant: "destructive"
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUserId) return;

    if (!profile.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Имя не может быть пустым",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name.trim(),
          surname: profile.surname?.trim() || null,
          position: profile.position?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Профиль обновлен"
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GameHeader 
          title="Загрузка..." 
          showBackButton 
          onBack={onBack} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4">
        <GameHeader 
          title="Настройки профиля" 
          subtitle="Измените свои данные"
          showBackButton 
          onBack={onBack} 
        />

        <GameCard>
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Имя *
              </Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Введите ваше имя"
                className="mt-2 border-border/60 focus:border-primary/60 rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="surname" className="text-sm font-medium text-foreground">
                Фамилия
              </Label>
              <Input
                id="surname"
                value={profile.surname || ""}
                onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                placeholder="Введите вашу фамилию"
                className="mt-2 border-border/60 focus:border-primary/60 rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="position" className="text-sm font-medium text-foreground">
                Должность
              </Label>
              <Input
                id="position"
                value={profile.position || ""}
                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                placeholder="Введите вашу должность"
                className="mt-2 border-border/60 focus:border-primary/60 rounded-lg"
              />
            </div>

            <Button 
              onClick={handleSaveProfile} 
              variant="game" 
              size="lg" 
              className="w-full"
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </GameCard>
      </div>
    </div>
  );
};