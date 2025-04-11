import { BrowserRouter, Routes, Route } from 'react-router';
import { Authenticate } from './views/Authenticate';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { ErrorPage } from './views/ErrorPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/login' Component={Login} />
          <Route path='/oauth2/callback' Component={Authenticate} />
          <Route path='/error' Component={ErrorPage} />
          <Route path='/' Component={Home} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
