import '../App.css'
import UserPoints from "../components/UserPoints.tsx";
import axiosInstance from "../AxiosInstance.tsx";
import { useWebSocket } from 'react-use-websocket';

function Home() {

    // GLHF - https://www.youtube.com/watch?v=qOiNKDsVP4o&t=318s
    // TODO: Websockets !
    // const socketUrl = 'wss://your-websocket-url';
    // const { sendJsonMessage, lastJsonMessage } = useWebSocket(socketUrl);

    return (

        <div>
            <UserPoints isStaff={false}/>
            <h2>You're logged in!</h2>
        </div>
    )

}

export default Home