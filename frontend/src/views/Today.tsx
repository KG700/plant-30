import { useEffect, useState } from 'react';
import { Plant } from '../types';
import { EnterPlantInput } from '../components/EnterPlantInput';
import '../App.css';

export function Today() {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isFetchError, setIsFetchError] = useState(false);
    const [isDeleteError, setIsDeleteError] = useState(false);

    // TODO: need to get the userId somehow - probably taken from the url and saved into the state.

    const fetchPlants = async () => {
      try {
        const data = await fetch(`${process.env.REACT_APP_BASE_URL}/user/67bc93477fcac69fbfe17d44/plants?when=today`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: 'include'
        })
        const plantsData = await data.json()
        setPlants(plantsData)
        setIsFetchError(false)
        setIsDeleteError(false)
      } catch (error) {
        setIsFetchError(true)
      }
    }

  useEffect(() => {
    fetchPlants()
  }, []);

  function listPlants() {
    if (isFetchError) {
      return (<p>Error fetching the plants you have eaten today</p>)
    }

    if (plants.length === 0) {
      return  (<p>You have not added any plants for today yet</p>)
    }

    return (
      <ul>
        { plants.map((plant) => {
          return <li key={plant._id}>{ plant.name } <button onClick={() => handleDeletePlant(plant._id)}>Delete</button></li>
        }) }
      </ul>
      )
  }

  async function handleDeletePlant(plant_id: string) {
    setIsDeleteError(false)
    try {
      await fetch(`${process.env.REACT_APP_BASE_URL}/user/67bc93477fcac69fbfe17d44/delete-plant/${plant_id}?when=today`, {
        headers: {
          'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        method: 'DELETE'
      })
      fetchPlants()
    } catch (error) {
      setIsDeleteError(true)
    }
  }

  return (
    <div className="App" data-testid="today-view">
      <header className="App-header">
        <h2>Number of plants eaten today: {plants.length}</h2>
        <EnterPlantInput onPlantAdded={fetchPlants}/>
        { isDeleteError && <p>Failed to delete plant from list</p>}
        <h2>Plants eaten today:</h2>
        { listPlants() }
      </header>
    </div>
  )
}
