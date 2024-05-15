import './App.css';
import Join from "./pages/Join.tsx";
import Home from "./pages/Home.tsx";
import Admin from "./pages/Admin.tsx";
import Loading from "./components/Loading.tsx";
import axiosInstance from "./AxiosInstance.tsx";

import {useState, useEffect} from 'react';

function App() {

    const [currentUser, setCurrentUser] = useState<boolean>(null);
    const [isStaff, setIsStaff] = useState<boolean>(false);

    function handleSetCurrentUser(authorized: boolean) {
        setCurrentUser(authorized);
    }

    useEffect(() => {
        axiosInstance.get("/api/user")
            .then(function (res) {
                setIsStaff(res.data['user']['is_staff']);
                setCurrentUser(true);
            })
            .catch(function (error) {
                setCurrentUser(false);
            });
    }, []);

    if (currentUser == null) {
        return Loading()
    }

    if (currentUser) {
        if (isStaff) {
            return (
                <Admin/>
            )
        }
        return (
            <Home/>
        );
    }
    return (
        <Join handleState={handleSetCurrentUser}/>
    );

}

export default App
