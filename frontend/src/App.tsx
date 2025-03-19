import { useEffect, useState } from 'react';
import { Plant } from './types';
import './App.css';

function App() {

  const [plants, setPlants] = useState<Plant[]>([]);
  // TODO: need to get the user_id somehow - probably taken from the url and saved into the state.

  useEffect(() => {
    fetch('http://127.0.0.1:8000/user/67bc93477fcac69fbfe17d44/plants?when=today', {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }).then((response) => {
      return response.json()
    }).then((data) => {
      console.log(data)
      setPlants(data);
    })
  }, []);


  return (
    <div className="App">
      <header className="App-header">
        <ul>
          { plants.map((plant) => {
            return <li>{ plant.name }</li>
          }) }
        </ul>
      </header>
    </div>
  );
}

export default App;
