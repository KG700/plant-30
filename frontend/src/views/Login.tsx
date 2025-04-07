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
        <div>
            <button onClick={handleLogin}>login</button>
        </div>
    )
}
