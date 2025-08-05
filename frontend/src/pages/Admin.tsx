import UserPoints from "../components/UserPoints.tsx";
import Logout from "../components/Logout.tsx";
import {ReadyState} from 'react-use-websocket';
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
                    <UserPoints isStaff={true} sendMessage={() => {}} lastMessage={null} readyState={ReadyState.CLOSED}/>
                </Grid>

            </Grid>

        </div>
    )
}

export default Admin
