import { Link } from "react-router-dom";

export const MainPage = () => {
  return (
    <>
      <div>Main page is working</div>
      <div className="text-green-500 mx-20">
        Tailwind css styles are working
      </div>
      <Link to="/secondary">Переход на вторую страницу</Link>
    </>
  );
};
