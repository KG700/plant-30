import { useNavigate } from "react-router";

export function ErrorPage() {
  const navigate = useNavigate();

  async function handleRedirect() {
    navigate("/login");
  }

  return (
    <div className="App" data-testid="login-view">
      <header className="App-header">
        <h1>There has been an issue logging you in</h1>
        <p>Please try again</p>
        <button onClick={handleRedirect}>Go back to login page</button>
      </header>
    </div>
  );
}
