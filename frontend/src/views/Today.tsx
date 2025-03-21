import { useEffect, useState } from 'react';
import { Plant } from '../types';
import '../App.css';

export function Today() {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isError, setIsError] = useState(false);
    // TODO: need to get the userId somehow - probably taken from the url and saved into the state.
    // TODO: move the baseUrl into a configurable variable - changes by environment
    // TODO: move the origin into a configurable variable - changes by environment

  useEffect(() => {
    const fetchPlants = async () => {
      const data = await fetch('http://127.0.0.1:8000/user/67bc93477fcac69fbfe17d44/plants?when=today', {
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000'
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

  return (
    <div className="App" data-testid="today-view">
    <header className="App-header">
      <h2>Number of plants eaten today: {plants.length}</h2>
      <h2>Plants eaten today:</h2>
      { listPlants() }
    </header>
  </div>
  )
}
