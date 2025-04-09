import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plant } from '../types';
import { EnterPlantInput } from '../components/EnterPlantInput';
import { LogoutButton } from '../components/LogoutButton';
import '../App.css';

export function Today() {
    const navigate = useNavigate();
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isFetchError, setIsFetchError] = useState(false);
    const [isDeleteError, setIsDeleteError] = useState(false);

    const fetchPlants = async () => {
      const token = localStorage.getItem('token');
      if (!token) navigate('/login')
      try {
        const data = await fetch(`${process.env.REACT_APP_BASE_URL}/user/plants?when=today`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (!data.ok) {
          if (data.status === 401) navigate('/login');
        }
        const plantsData = await data.json()

        setIsFetchError(false)
        setIsDeleteError(false)
        setPlants(plantsData ? plantsData : [])
      } catch (error) {
        console.log({ error })
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
    const token = localStorage.getItem('token');
    if (!token) navigate('/login')
    setIsDeleteError(false)
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/user/delete-plant/${plant_id}?when=today`, {
        headers: {
          'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
          'Authorization': `Bearer ${token}`
        },
        method: 'DELETE'
      })

      if (!response.ok) {
        if (response.status === 401) navigate('/login');
      }

      fetchPlants()
    } catch (error) {
      console.log(error)
      setIsDeleteError(true)
    }
  }

  return (
    <div className="App" data-testid="today-view">
      <header className="App-header">
        <LogoutButton />
        <h2>Number of plants eaten today: {plants.length}</h2>
        <EnterPlantInput onPlantAdded={fetchPlants}/>
        { isDeleteError && <p>Failed to delete plant from list</p>}
        <h2>Plants eaten today:</h2>
        { listPlants() }
      </header>
    </div>
  )
}
