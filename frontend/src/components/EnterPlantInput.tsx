import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { Plant } from "../types";
import { CreateNewPlant } from "./CreateNewPlant";

type PlantInputProps = {
  pageDate: "today" | "yesterday" | string;
  onPlantAdded: () => void;
};

export function EnterPlantInput({
  pageDate,
  onPlantAdded,
}: Readonly<PlantInputProps>) {
  const navigate = useNavigate();
  const [plantList, setPlantList] = useState<Plant[]>([]);
  const [isError, setIsError] = useState(false);
  const [enteredPlant, setEnteredPlant] = useState("");
  const [enteredPlantMessage, setEnteredPlantMessage] = useState("");
  const [dropDownOpen, setDropDownOpen] = useState(false);
  const [isAddingPlant, setIsAddingPlant] = useState(false);

  const closeDropDownOnClick = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const searchPlants = async () => {
    try {
      const data = await fetch(
        `${process.env.REACT_APP_BASE_URL}/plants/search?q=${enteredPlant}`,
        {
          headers: {
            "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
          },
        },
      );
      const plantData = await data.json();
      setPlantList(plantData);
      setIsError(false);
    } catch (error) {
      console.log(error);
      setIsError(true);
    }
  };

  useEffect(() => {
    searchPlants();
  }, [enteredPlant]);

  useEffect(() => {
    const closeDropDownOnClickFn = (event: MouseEvent) => {
      if (
        dropDownOpen &&
        !closeDropDownOnClick.current?.contains(event.target as Node)
      ) {
        setDropDownOpen(false);
      }
    };
    document.addEventListener("click", closeDropDownOnClickFn);

    return () => {
      document.removeEventListener("click", closeDropDownOnClickFn);
    };
  }, [closeDropDownOnClick, dropDownOpen]);

  useEffect(() => {
    const closeMessageOnClickFn = (event: MouseEvent) => {
      if (
        enteredPlantMessage &&
        !messageRef.current?.contains(event.target as Node)
      ) {
        setEnteredPlantMessage("");
      }
    };
    document.addEventListener("click", closeMessageOnClickFn);

    return () => {
      document.removeEventListener("click", closeMessageOnClickFn);
    };
  }, [messageRef, enteredPlantMessage]);

  function openDropDown() {
    setDropDownOpen(true);
  }

  function closeDropDown() {
    setDropDownOpen(false);
  }

  function handlePlantItemClick(plant: Plant) {
    submitPlant(plant);
  }

  function handlePlantItemKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    plant: Plant,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitPlant(plant);
    }
  }

  async function submitPlant(plant: Plant) {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    closeDropDown();
    setEnteredPlant("");
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/add-plant/${plant._id}?when=${pageDate}`,
        {
          headers: {
            "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
            Authorization: `Bearer ${token}`,
          },
          method: "POST",
        },
      );

      if (!response.ok) {
        if (response.status === 401) navigate("/login");

        const errorData = await response.json();
        throw new Error(errorData.detail ?? "Failed to add plant");
      }

      setEnteredPlantMessage(`Added ${plant.name} to your plants`);
      onPlantAdded();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "Plant already exists in user's collection"
      ) {
        setEnteredPlantMessage(`You already have ${plant.name} in your plants`);
      } else {
        setEnteredPlantMessage(
          `Failed to add ${plant.name} to your plants. Please try again.`,
        );
      }
    }
  }

  return (
    <div ref={closeDropDownOnClick}>
      <form>
        <input
          type="text"
          aria-label="enter-plant"
          placeholder="Search for plant"
          value={enteredPlant}
          onChange={(event) => setEnteredPlant(event.target.value)}
          onClick={openDropDown}
        />
      </form>
      {isError && <p>Error fetching plants</p>}
      {dropDownOpen && (
        <div className="dropdown" data-testid="plant-dropdown">
          <button
            onClick={() => setIsAddingPlant(!isAddingPlant)}
            onKeyDown={() => setIsAddingPlant(!isAddingPlant)}
          >
            Create new plant
          </button>
          {isAddingPlant && (
            <CreateNewPlant enteredPlant={enteredPlant} onAdd={submitPlant} />
          )}
          {plantList.map((plant) => {
            return (
              <button
                key={plant._id}
                className="dropdown-items"
                onClick={() => handlePlantItemClick(plant)}
                onKeyDown={(event) => handlePlantItemKeyDown(event, plant)}
              >
                {plant.name}
              </button>
            );
          })}
        </div>
      )}
      {enteredPlantMessage && <p ref={messageRef}>{enteredPlantMessage}</p>}
    </div>
  );
}
