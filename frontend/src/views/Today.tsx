import { MouseEvent, useEffect, useState } from 'react';
import { Plant } from '../types';
import '../App.css';

export function Today() {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isError, setIsError] = useState(false);
    const [enteredPlant, setEnteredPlant] = useState('');
    const [enteredPlantError, setEnteredPlantError] = useState('')
    // TODO: need to get the userId somehow - probably taken from the url and saved into the state.

  useEffect(() => {
    const fetchPlants = async () => {
      //TODO: Needs error handling if fetch fails
      const data = await fetch(`${process.env.REACT_APP_BASE_URL}/user/67bc93477fcac69fbfe17d44/plants?when=today`, {
        headers: {
          'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
        }
      })
      return await data.json()
    }

    fetchPlants()
      .then((data) => {
        setPlants(data)
        setIsError(false)
      })
      .catch(() => setIsError(true))
  }, []);

  function listPlants() {
    if (isError) {
      return (<p>Error fetching plants</p>)
    }

    if (plants.length === 0) {
      return  (<p>You have not added any plants for today yet</p>)
    }

    return (
      <ul>
        { plants.map((plant) => {
          return <li key={plant.id}>{ plant.name }</li>
        }) }
      </ul>
      )
  }

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
    <div className="App" data-testid="today-view">
    <header className="App-header">
      <h2>Number of plants eaten today: {plants.length}</h2>
      <form>
        <label>
          Enter plant:
          <input type="text" aria-label="enter-plant" value={enteredPlant} onChange={(event) => setEnteredPlant(event.target.value)} />
        </label>
        <button type="submit" onClick={(event) => submitPlant(event)}>Submit</button>
      </form>
      {enteredPlantError && <p>{enteredPlantError}</p>}
      <h2>Plants eaten today:</h2>
      { listPlants() }
    </header>
  </div>
  )
}
