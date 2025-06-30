import '../App.css'
import UserPoints from "../components/UserPoints.tsx";
import axiosInstance from "../AxiosInstance.tsx";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {Grid} from "@mui/material";
import Logout from "../components/Logout.tsx";
import {useEffect, useState} from "react";
import {Button} from "@mui/material";
import Info from "../questions/Info.tsx";
import {pointsSocket} from "../../WebSockets.tsx";
import MultipleChoice from "../questions/MultipleChoice.tsx";

interface Props {
    isAdmin: boolean
}

function Home({isAdmin}: Props) {

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

    const [question, setQuestion] = useState(null);
    const [timer, setTimer] = useState(30);
    const [active, setActive] = useState(false);
    const [data, setData] = useState(null);
    const {sendMessage, lastMessage, readyState} = useWebSocket(pointsSocket);


    // TODO: Websockets - https://www.npmjs.com/package/react-use-websocket
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    useEffect(() => {
        if (lastMessage) {
            const messageData = JSON.parse(lastMessage["data"]);

            if ("direction" in messageData) {
                getQuestion();
                setTimer(messageData["timer"]);
            }

            if ("timer" in messageData) {
                setTimer(messageData["timer"]);
            }

        }

    }, [lastMessage]);

    const fetchInitialData = () => {
        if (!data) {
            getQuestion();
        }
    }

    // ===================================================================================          Timer

    const startTimer = (e) => {
        sendMessage(JSON.stringify({"start_timer": data["time"]}));
    }

    // ===================================================================================      BACKEND REQUESTS
    const getQuestion = () => {
        // console.log("Getting question");
        axiosInstance.get(
            "/get-question",
        ).then(function (res) {
            setData(res.data);
            if ("current_question" in res.data) {
                setQuestion(res.data["current_question"]);
                // setTimer(res.data["time"]);
            } else {
                setQuestion(null);
            }
            // console.log(res.data);
        }).catch((e) => {
            console.log(e);
        });
    }

    const chooseQuestion = (e, direction) => {
        sendMessage(JSON.stringify({"direction": direction}));
    }


    // ===================================================================================      RENDER STUFF

    const renderTimer = () => {

        if (timer || timer === 0) {

            if (timer > 10) {

                return (
                    <div style={{
                        float: "right",
                        marginTop: "10px",
                        marginRight: "10px",
                        fontSize: "1.5rem"
                    }}>
                        {timer}
                    </div>
                )

            } else if (timer > 3 && timer <= 10) {
                return (
                    <div style={{
                        float: "right",
                        marginTop: "10px",
                        marginRight: "10px",
                        fontSize: "5rem",
                        color: "yellow"
                    }}>
                        {timer}
                    </div>
                )
            } else {
                return (
                    <div style={{
                        float: "right",
                        marginTop: "10px",
                        marginRight: "10px",
                        fontSize: "10rem",
                        color: "red"
                    }}>
                        {timer}
                    </div>
                )
            }

        }

        if ("time" in data) {
            if (parseInt(data["time"]) > -1) {
                return (
                    <div style={{
                        float: "right",
                        marginTop: "10px",
                        marginRight: "10px",
                        fontSize: "1.5rem"
                    }}>
                        {data["time"]}
                    </div>
                )
            }
        }
    }

    const renderQuestionNumber = () => {
        if (question) {
            return (
                <h4>Question {question}</h4>
            )
        }
    }

    const renderQuestion = () => {
        switch (data["type"]) {

            case 'info':
                return <Info data={data}/>

            case "multipleChoice":
                return <MultipleChoice data={data} timer={timer} sendMessage={sendMessage}/>

        }
    }

    fetchInitialData();

    if (data) {

        return (
            <Grid container>

                <Grid item xs={0.6} hidden={!isAdmin}>
                    <Logout/>
                </Grid>

                <Grid item xs={isAdmin ? 10.4 : 11}>

                    <div className={"neon-text"}>
                        FABRIKOTS
                    </div>

                    <div className={"q-container"} style={{marginTop: "50px"}}>

                        <div style={{width: "200px"}}>
                            {renderQuestionNumber()}
                        </div>

                        <div className={"questions"}>

                            <Grid container justifyContent={"space-between"} alignItems={"space-between"}>

                                <Grid item xs={12} style={{minHeight: "40rem"}}>

                                    {renderTimer()}
                                    {renderQuestion()}

                                </Grid>


                                <Grid item xs={6} style={{maxWidth: "100px"}} hidden={!isAdmin}>

                                    <Button variant="outline-secondary"
                                            onClick={e => chooseQuestion(e, "previous")}
                                            style={{
                                                color: "white",
                                                border: "solid 1px white",
                                                fontSize: "1rem",
                                                margin: "1rem"
                                            }}>
                                        Previous
                                    </Button>

                                </Grid>

                                <Grid item xs={6} style={{maxWidth: "100px"}} hidden={!isAdmin}>

                                    <Button variant="outline-secondary"
                                            onClick={e => chooseQuestion(e, "next")}
                                            style={{
                                                color: "white",
                                                border: "solid 1px white",
                                                fontSize: "1rem",
                                                margin: "1rem"
                                            }}>
                                        Next
                                    </Button>

                                </Grid>

                                <Grid item xs={12} style={{maxWidth: "100px"}} hidden={!isAdmin}>
                                    <Button variant="outline-secondary"
                                            onClick={e => startTimer(e)}
                                            style={{
                                                color: "white",
                                                border: "solid 1px white",
                                                fontSize: "1rem",
                                                margin: "1rem"
                                            }}>
                                        Start Timer
                                    </Button>
                                </Grid>

                            </Grid>

                        </div>
                    </div>

                </Grid>

                <Grid item xs={1}>
                    <UserPoints lastMessage={lastMessage} sendMessage={sendMessage} readyState={readyState}
                                isStaff={isAdmin}/>
                </Grid>

            </Grid>

        )
    } else {
        return (
            "Still loading ngr..."
        )
    }
}

export default Home