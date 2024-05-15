import UserPoints from "../components/UserPoints.tsx";
import Logout from "../components/Logout.tsx";
import {useState} from "react";
import axiosInstance from "../AxiosInstance.tsx";
import useWebSocket, {ReadyState} from 'react-use-websocket';
import {pointsSocket} from "../../WebSockets.tsx";

function Admin() {

    /***
     TODO:
     - show timer for question
     - button to start the timer for everyone currently playing
     - show current question
     - show answer(s) or answer options
     - button for next question
     - button for previous question
     - notes for each question
     **/

    const [question, setQuestion] = useState();

    const questions = () => {
        axiosInstance.post(
            "/api/logout",
            {withCredentials: true}
        ).then(function (res) {
            console.log(res)
            localStorage.removeItem('sessionid');
            localStorage.removeItem('csrftoken');
        });
    }

    return (
        <div>
            <Logout/>
            <UserPoints isStaff={true}/>
            Admin ?
        </div>
    )
}

export default Admin
