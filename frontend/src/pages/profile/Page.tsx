import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import { getCurrentUser } from "@/api/auth";
import type { CurrentUserResponse } from "@/api/types";

function hasStoredUser(): boolean {
  const raw = localStorage.getItem("user");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { token?: unknown };
    return typeof parsed.token === "string";
  } catch {
    return false;
  }
}

export const ProfilePage = () => {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasStoredUser()) {
      navigate("/");
      return;
    }

    getCurrentUser()
      .then((userData) => {
        setUser(userData);
        const raw = localStorage.getItem("user");
        if (!raw) return;
        const storedUser = JSON.parse(raw) as object;
        localStorage.setItem("user", JSON.stringify({ ...storedUser, ...userData }));
      })
      .catch(() => {
        localStorage.removeItem("user");
        navigate("/");
      });
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
              {user.skills.map((skill) => (
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
