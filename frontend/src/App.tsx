import './App.css';
import Join from "./pages/Join.tsx";
import Home from "./pages/Home.tsx";
import Loading from "./components/Loading.tsx";
import axiosInstance from "./AxiosInstance.tsx";

import {useState, useEffect} from 'react';

function App() {

    const [currentUser, setCurrentUser] = useState<boolean | null>(null);
    const [isStaff, setIsStaff] = useState<boolean>(false);

    function handleSetCurrentUser(authorized: boolean) {
        setCurrentUser(authorized);
    }

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                // First, ensure we have a CSRF token in production
                if (import.meta.env.PROD) {
                    await axiosInstance.get('/api/csrf-token');
                }
                
                // Then check user authentication
                const res = await axiosInstance.get("/api/user");
                setIsStaff(res.data['user']['is_staff']);
                setCurrentUser(true);
            } catch (error) {
                setCurrentUser(false);
            }
        };
        
        checkAuthentication();
    }, []);

    if (currentUser == null) {
        return Loading()
    }

    if (currentUser) {
        return (
            <Home isAdmin={isStaff}/>
        )
    }
    
    return (
        <Join handleState={handleSetCurrentUser}/>
    );

}

export default App
