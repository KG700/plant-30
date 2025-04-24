import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export function Recommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({});
  const [isFetchError, setIsFetchError] = useState(false);

  const fetchRecommendations = async () => {
    const token = localStorage.getItem("token");
    try {
      const data = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/plants/recommendations`,
        {
          headers: {
            "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (!data.ok) {
        if (data.status === 401) navigate("/login");
      }
      const plantsData = await data.json();

      setRecommendations(plantsData ?? []);
      console.log(plantsData);
    } catch (error) {
      console.log({ error });
      setIsFetchError(true);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return <div>Recommendations!</div>;
}
