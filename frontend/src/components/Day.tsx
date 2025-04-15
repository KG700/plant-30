import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plant } from "../types";
import { EnterPlantInput } from "./EnterPlantInput";
import "../App.css";

interface DayProps {
  pageDate: string;
}

export function Day({ pageDate }: Readonly<DayProps>) {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isFetchError, setIsFetchError] = useState(false);
  const [isDeleteError, setIsDeleteError] = useState(false);

  const fetchPlants = async () => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    try {
      const data = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/day-plants?when=${pageDate}`,
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
        throw new Error(await data.json());
      }

      const plantsData = (await data.json()) as Plant[];

      setIsFetchError(false);
      setIsDeleteError(false);
      setPlants(plantsData ?? []);
    } catch (error) {
      console.log({ error });
      setIsFetchError(true);
      setPlants([]);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, [pageDate]);

  function listPlants() {
    if (isFetchError) {
      return <p>Error fetching the plants you have eaten today</p>;
    }

    if (plants.length === 0) {
      return <p>You have not added any plants for today yet</p>;
    }

    return (
      <ul>
        {plants.map((plant) => {
          return (
            <li key={plant._id}>
              {plant.name}{" "}
              <button onClick={() => handleDeletePlant(plant._id)}>
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  async function handleDeletePlant(plant_id: string) {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    setIsDeleteError(false);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/delete-plant/${plant_id}?when=${pageDate}`,
        {
          headers: {
            "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
            Authorization: `Bearer ${token}`,
          },
          method: "DELETE",
        },
      );

      if (!response.ok) {
        if (response.status === 401) navigate("/login");
      }

      fetchPlants();
    } catch (error) {
      console.log(error);
      setIsDeleteError(true);
    }
  }

  return (
    <div className="App" data-testid="today-view">
      <main className="App-main">
        <h2>Total: {plants.length}</h2>
        <EnterPlantInput pageDate={pageDate} onPlantAdded={fetchPlants} />
        {isDeleteError && <p>Failed to delete plant from list</p>}
        {listPlants()}
      </main>
    </div>
  );
}
