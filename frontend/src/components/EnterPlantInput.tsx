import { useState, MouseEvent, useEffect } from "react";
import { Plant } from "../types";

export function EnterPlantInput() {
    const [plantList, setPlantList] = useState<Plant[]>([]);
    const [isError, setIsError] = useState(false);
    const [enteredPlant, setEnteredPlant] = useState('');
    const [enteredPlantError, setEnteredPlantError] = useState('')

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

    async function submitPlant(event: MouseEvent<HTMLButtonElement>) {
        //TODO: Needs to retrieve the correct plant_id
        //TODO: Needs error handling if fetch fails

        event.preventDefault();

        if (!enteredPlant) {
          setEnteredPlantError('Error, must enter a plant before submitting')
          return;
        }
        setEnteredPlantError('')
        await fetch(`${process.env.REACT_APP_BASE_URL}/user/67bc93477fcac69fbfe17d44/add-plant/67bdca3d86bc1187fad97937`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
          },
          method: 'POST'
        })
      }

    return (
        <div>
            <form>
                <label>
                    Enter plant: <input type="text" aria-label="enter-plant" value={enteredPlant} onChange={(event) => setEnteredPlant(event.target.value)} />
                </label>
                <button type="submit" onClick={(event) => submitPlant(event)}>Submit</button>
            </form>
        {enteredPlantError && <p>{enteredPlantError}</p>}
        {isError && <p>Error fetching plants</p>}
        <ul>
          { plantList.map((plant) => {
            return <li key={plant._id}>{ plant.name }</li>
          }) }
        </ul>
      </div>
    )
}
