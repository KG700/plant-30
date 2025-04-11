import { useState } from "react";
import { Day } from '../components/Day';
import { Week } from "../components/Week";
import { LogoutButton } from "../components/LogoutButton";
import { HomeNavigation } from "../components/HomeNavigation";

export function Home() {
    const [isDayView, setIsDayView] = useState(true);

    return (
        <div className="App" data-testid="today-view">
            <header className="App-header">
            <LogoutButton />
            <h1>30 Plants</h1>
            <HomeNavigation setIsDayView = {setIsDayView} />
            {isDayView
                ? <Day />
                : <Week />
            }
            </header>
        </div>
    )
}
