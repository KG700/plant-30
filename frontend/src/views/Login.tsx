import { useNavigate } from "react-router";

export function Login() {
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/login`, {
        headers: {
          "Access-Control-Allow-Origin": process.env.REACT_APP_ORIGIN ?? "",
        },
      });

      const auth_url = await response.json();
      window.location.href = auth_url;
    } catch (error) {
      console.log(error);
      navigate("/error");
    }
  }

  return (
    <div className="App" data-testid="login-view">
      <header className="App-header">
        <h1>Login to Plant30</h1>
        <button onClick={handleLogin}>login with Google</button>
      </header>
    </div>
  );
}
