import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plant } from "../types";

export function Week() {
    const navigate = useNavigate();
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isFetchError, setIsFetchError] = useState(false);

    const fetchPlants = async () => {
        const token = localStorage.getItem('token');
        try {
            const data = await fetch(`${process.env.REACT_APP_BASE_URL}/user/week-plants?when=today`, {
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

            setPlants(plantsData ?? [])
          } catch (error) {
            console.log({ error })
            setIsFetchError(true)
          }
    }

    useEffect(() => {
        fetchPlants()
    }, [])

    function listPlants() {
        if (isFetchError) {
          return (<p>Error fetching the plants you have eaten this week</p>)
        }

        if (plants.length === 0) {
          return  (<p>You have not added any plants this week yet</p>)
        }

        return (
          <ul>
            { plants.map((plant) => {
              return <li key={plant._id}>{ plant.name }</li>
            }) }
          </ul>
          )
      }

    return (
        <div className="App" data-testid="today-view">
            <header className="App-header">
                <h2>Number of plants eaten this week: {plants.length}</h2>
                <h2>Plants eaten this week:</h2>
                { listPlants() }
            </header>
        </div>
    )

}
