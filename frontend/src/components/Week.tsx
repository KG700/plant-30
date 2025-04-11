import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CategoryLabels, Plant, categoryLabelMap } from "../types";

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

        let orderedPlants: { [key: string]: Plant[] } = {};

        plants.forEach((plant) => {
          const categoryLabel = categoryLabelMap[plant.category];
          if (!orderedPlants[categoryLabel]) {
            orderedPlants[categoryLabel] = [];
          }
          orderedPlants[categoryLabel].push(plant);
        });

        return (
          <div>
            { Object.values(CategoryLabels).map((label) => {
              return (
                <div key={label}>
                  { label in orderedPlants &&
                    <>
                      <h3>{label}</h3>
                      <ul>
                        {orderedPlants[label].map((plant) => {
                          return <li key={plant._id}>{plant.name}</li>
                        })}
                      </ul>
                    </>
                  }
                </div>
              )
            })}
          </div>
        )
      }

    return (
        <div className="App" data-testid="week-view">
            <main className="App-main">
                <h2>Total: {plants.length}</h2>
                { listPlants() }
            </main>
        </div>
    )

}
