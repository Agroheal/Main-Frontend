import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Lottie from "lottie-react";
import NoDataFound from "../../assets/Icon/searching.json";

const Error = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Lottie
          animationData={NoDataFound}
          width={250}
          height={250}
          loop={true}
        />
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-green-800">Oops! Page not found</p>
        <a
          href="/"
          className="text-green-900 underline hover:text-green-900/90"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default Error;
