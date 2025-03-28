import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Plant } from "../types";

type PlantInputProps = {
  onPlantAdded: () => void;
};

export function EnterPlantInput({ onPlantAdded }: PlantInputProps) {
    const [plantList, setPlantList] = useState<Plant[]>([]);
    const [isError, setIsError] = useState(false);
    const [enteredPlant, setEnteredPlant] = useState('');
    const [enteredPlantMessage, setEnteredPlantMessage] = useState('')
    const [dropDownOpen, setDropDownOpen] = useState(false)

    const closeDropDownOnClick = useRef<HTMLInputElement>(null);

    const searchPlants = async () => {
      try {
        const data = await fetch(`${process.env.REACT_APP_BASE_URL}/plants/search?q=${enteredPlant}`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
          }
        })
        const plantData = await data.json()
        setPlantList(plantData)
        setIsError(false)
      } catch (error) {
        console.log(error);
        setIsError(true)
      }
    }

    useEffect(() => {
      searchPlants()
    }, [enteredPlant]);

  useEffect(() => {
    const closeDropDownOnClickFn = (event: any) => {
      if(dropDownOpen && !closeDropDownOnClick.current?.contains(event.target)) {
        setDropDownOpen(false)
      }
    }
    document.addEventListener("click", closeDropDownOnClickFn)
  }, [closeDropDownOnClick, dropDownOpen]);

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      setEnteredPlantMessage("")
    }
  }

    function openDropDown() {
      setEnteredPlantMessage("")
      setDropDownOpen(true)
    }

    function closeDropDown() {
      setDropDownOpen(false)
    }

    function handlePlantItemClick(plant: Plant) {
      submitPlant(plant);
    }

    function handlePlantItemKeyDown(event: KeyboardEvent<HTMLLIElement>, plant: Plant) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitPlant(plant);
      }
    }

    async function submitPlant(plant: Plant) {
      closeDropDown();
      setEnteredPlant("")
        //TODO: Needs error handling if fetch fails or if plant has already been added?
        await fetch(`${process.env.REACT_APP_BASE_URL}/user/67bc93477fcac69fbfe17d44/add-plant/${plant._id}`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
          },
          method: 'POST'
        })
        onPlantAdded();
        setEnteredPlantMessage(`Added ${plant.name} to your plants`)
      }

    return (
      <div ref={closeDropDownOnClick} onClick={handleClick}>
        <form>
          <input type="text" aria-label="enter-plant" placeholder='Search for plant' value={enteredPlant} onChange={(event) => setEnteredPlant(event.target.value)} onClick={openDropDown}/>
        </form>
        {isError && <p>Error fetching plants</p>}
        {dropDownOpen &&
          <ul className="dropdown" data-testid="plant-dropdown">
            { plantList.map((plant) => {
              return <li key={plant._id} className="dropdown-items" onClick={() => handlePlantItemClick(plant) } onKeyDown={(event) => handlePlantItemKeyDown(event, plant)}>{ plant.name }</li>
            }) }
          </ul>
        }
        {enteredPlantMessage && <p>{enteredPlantMessage}</p>}
      </div>
    )
}
