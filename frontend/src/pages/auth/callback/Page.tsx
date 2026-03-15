import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticate } from "@/api/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function extractTokenFromHash(): string | null {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("access_token");
}

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = extractTokenFromHash();

    if (!token) {
      setError("Не удалось получить токен от Яндекса");
      return;
    }

    authenticate(token)
      .then((user) => {
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/profile", { replace: true });
      })
      .catch(() => {
        setError("Ошибка авторизации. Попробуйте снова.");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive text-lg">{error}</p>
        <Button onClick={() => navigate("/")}>Вернуться на главную</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
};
