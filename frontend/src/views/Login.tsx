export function Login() {

    async function handleLogin() {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/login`, {
          headers: {
            'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
          }
        })

        const auth_url = await response.json()
        window.location.href = auth_url
      }

    return (
        <div className="App" data-testid="login-view">
          <header className="App-header">
            <h1>Login to Plant30</h1>
            <button onClick={handleLogin}>login with Google</button>
          </header>
        </div>
    )
}
