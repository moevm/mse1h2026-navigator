import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const YANDEX_CLIENT_ID = import.meta.env.VITE_YANDEX_CLIENT_ID;

function handleYandexLogin() {
  const redirectUri = encodeURIComponent(
    window.location.origin + "/auth/callback",
  );
  window.location.href = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${redirectUri}`;
}

export const MainPage = () => {
  return (
    <>
      <div>Main page is working</div>
      <div className="text-green-500 mx-20">
        Tailwind css styles are working
      </div>
      <Link to="/secondary">Переход на вторую страницу</Link>

      <div className="mt-8 flex justify-center">
        <Button onClick={handleYandexLogin} size="lg">
          Войти через Яндекс ID
        </Button>
      </div>
    </>
  );
};
