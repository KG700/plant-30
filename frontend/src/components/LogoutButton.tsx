import { useNavigate } from "react-router";

export function LogoutButton() {
    const navigate = useNavigate();

    async function handleLogout() {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login')
        try {
          fetch(`${process.env.REACT_APP_BASE_URL}/user/logout`, {
            headers: {
                'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? '',
                'Authorization': `Bearer ${token}`
          },
            method: 'DELETE'
          })
          localStorage.removeItem('token');
          navigate('/login');
        } catch(error) {
          console.log({ error })
        }
      }

    return (
        <button onClick={handleLogout}>Logout</button>
    )
}
