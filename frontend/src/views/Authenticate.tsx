import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export function Authenticate() {
    const location = useLocation();
    const navigate = useNavigate()
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const authenticateUser = async () => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');

        if (code && !isAuthenticated) {
            try {
                const response = await fetch(`${process.env.REACT_APP_BASE_URL}/authorise`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': process.env.REACT_APP_ORIGIN ?? ''
                    },
                    body: JSON.stringify({ code })
                })
                if (!response.ok) {
                    setIsAuthenticated(false);
                    console.error('Error:', response.statusText);
                    return;
                }
                setIsAuthenticated(true);
                navigate('/');
            } catch(error) {
                setIsAuthenticated(false);
                console.error('Error:', error);
            };
        }
    }

    useEffect(() => {
        authenticateUser()
    }, []);

    return <div>{isAuthenticated ? "Redirecting..." : "Authenticating.."}</div>
}
