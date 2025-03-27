import { useState, MouseEvent, useEffect, useRef } from "react";
import { Plant } from "../types";

export function EnterPlantInput() {
    const [plantList, setPlantList] = useState<Plant[]>([]);
    const [isError, setIsError] = useState(false);
    const [enteredPlant, setEnteredPlant] = useState('');
    const [enteredPlantError, setEnteredPlantError] = useState('')
    const [dropDownOpen, setDropDownOpen] = useState(false)

    const closeDropDownOnClick = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const fetchPlants = async () => {
        //TODO: Needs error handling if fetch fails
        const data = await fetch(`${process.env.REACT_APP_BASE_URL}/plants/search?q=${enteredPlant}`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
          }
        })
        return await data.json()
      }

      fetchPlants()
      .then((data) => {
        setPlantList(data)
        setIsError(false)
      })
      .catch((error) => {
        console.log(error);
        setIsError(true)
      })
    }, [enteredPlant]);

  useEffect(() => {
    const closeDropDownOnClickFn = (event: any) => {
      if(dropDownOpen && !closeDropDownOnClick.current?.contains(event.target)) {
        setDropDownOpen(false)
      }
    }
    document.addEventListener("click", closeDropDownOnClickFn)
  }, [closeDropDownOnClick, dropDownOpen]);

    function openDropDown() {
      setDropDownOpen(true)
    }

    function closeDropDown() {
      setDropDownOpen(false)
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
      }

    return (
        <div ref={closeDropDownOnClick}>
            <form>
              <input type="text" aria-label="enter-plant" placeholder='Search for plant' value={enteredPlant} onChange={(event) => setEnteredPlant(event.target.value)} onClick={openDropDown}/>
                {/* <button type="submit" onClick={(event) => submitPlant(event)}>Submit</button> */}
            </form>
        {enteredPlantError && <p>{enteredPlantError}</p>}
        {isError && <p>Error fetching plants</p>}
        {dropDownOpen &&
        <ul className="dropdown" data-testid="plant-dropdown">
          { plantList.map((plant) => {
            return <li key={plant._id} className="dropdown-items"><a onClick={() => submitPlant(plant)}>{ plant.name }</a></li>
          }) }
        </ul>
}
      </div>
    )
}
