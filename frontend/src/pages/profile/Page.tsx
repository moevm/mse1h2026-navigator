import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import type { AuthResponse } from "@/api/types";

function getUserFromStorage(): AuthResponse | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export const ProfilePage = () => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [skills] = useState<string[]>(() => {
    const raw = localStorage.getItem("skills");
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserFromStorage();
    if (!userData) {
      navigate("/");
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  const initials =
    (user.lastName?.[0] ?? "") + (user.firstName?.[0] ?? "");
  const email = `${user.username}@yandex.ru`;

  return (
    <div className="min-h-screen bg-neutral-900 p-6">
      <Card className="mx-auto max-w-4xl min-h-[600px] flex flex-col">
        <CardContent className="flex flex-col flex-1 p-8">
          <Avatar className="size-14 mb-4">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback className="text-lg">
              {initials || <User className="size-6" />}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-lg font-bold mb-3">Профиль</h2>

          <p className="text-sm">
            {user.lastName} {user.firstName}
          </p>
          <p className="text-sm text-muted-foreground">{email}</p>

          <div className="mt-12">
            <p className="text-sm font-semibold mb-2">Изученные навыки:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
              <Button variant="outline" size="icon-xs" className="rounded-full">
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button variant="default" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
