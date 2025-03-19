import { useEffect, useState } from 'react';
import { Plant } from './types';
import './App.css';

function App() {

  const [plants, setPlants] = useState<Plant[]>([]);
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

    const plants = fetchPlants()
      .then((data) => setPlants(data))
      .catch(() => setPlants([{ id: 'error', name: 'Error fetching plants', category: 'error' }]))
  }, []);


  return (
    <div className="App">
      <header className="App-header">
        <ul>
          { plants.map((plant) => {
            return <li key={plant.id}>{ plant.name }</li>
          }) }
        </ul>
      </header>
    </div>
  );
}

export default App;
