import UserPoints from "../components/UserPoints.tsx";
import Logout from "../components/Logout.tsx";
import {useState} from "react";
import axiosInstance from "../AxiosInstance.tsx";
import useWebSocket, {ReadyState} from 'react-use-websocket';
import {pointsSocket} from "../../WebSockets.tsx";
import Grid from '@mui/material/Grid';

function Admin() {

    /***
     TODO:
     - button to start the timer for everyone currently playing
     - show current question
     - show answer(s) or answer options
     - button for next question
     - button for previous question
     - notes for each question
     - show timer for question
     **/

    /**
     *      question = {
     *          id: question id
     *          title: title
     *          question: string of question/s and or trivia or whatever
     *          type: some type, based on which a different template will be rendered
     *          notes: only for admin eyes !
     *      }
     */
    const [question, setQuestion] = useState();

    function sleep(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    return (
        <div>

            <Grid container>

                <Grid item xs={1}>
                    <Logout/>
                </Grid>

                <Grid item xs={10}>

                    <Grid container>
                        <Grid>
                            Admin page btw
                        </Grid>
                    </Grid>

                </Grid>

                <Grid item xs={1}>
                    <UserPoints isStaff={true}/>
                </Grid>

            </Grid>

        </div>
    )
}

export default Admin
