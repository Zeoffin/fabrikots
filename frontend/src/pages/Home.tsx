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
import FreeText from "../questions/FreeText.tsx";

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
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [timerStarted, setTimerStarted] = useState(false);
    const [allUserAnswers, setAllUserAnswers] = useState(null);
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
                setShowCorrectAnswer(false);
                setCorrectAnswer(null);
                setTimerStarted(false);
                setAllUserAnswers(null);
            }

            if ("timer" in messageData) {
                setTimer(messageData["timer"]);
                if (messageData["timer"] < (data ? data["time"] : 30)) {
                    setTimerStarted(true);
                }
            }

            if (messageData["type"] === "timer_ended") {
                setShowCorrectAnswer(true);
                setCorrectAnswer(messageData["correct_answer"]);
                if (messageData["question_type"] === "freeText" && messageData["all_user_answers"]) {
                    setAllUserAnswers(messageData["all_user_answers"]);
                }
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
            let timerClass = "timer-display ";
            
            if (timer > 10) {
                timerClass += "timer-normal";
            } else if (timer > 3 && timer <= 10) {
                timerClass += "timer-warning";
            } else {
                timerClass += "timer-critical";
            }

            return (
                <div className={timerClass} style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 10
                }}>
                    {timer}
                </div>
            )
        }

        if ("time" in data && parseInt(data["time"]) > -1) {
            return (
                <div className="timer-display timer-normal" style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 10
                }}>
                    {data["time"]}
                </div>
            )
        }
    }

    const renderQuestionNumber = () => {
        if (question) {
            return (
                <h4 style={{
                    color: 'rgba(0, 255, 170, 0.9)',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}>
                    Question {question}
                </h4>
            )
        }
    }

    const renderQuestion = () => {
        if (!timerStarted) {
            return (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "30rem"
                }}>
                    <h1 style={{
                        color: "white",
                        fontSize: "3rem",
                        fontWeight: "700",
                        textAlign: "center",
                        textShadow: "0 0 20px rgba(0, 255, 170, 0.5)"
                    }}>
                        {data["title"]}
                    </h1>
                </div>
            );
        }

        switch (data["type"]) {

            case 'info':
                return <Info data={data}/>

            case "multipleChoice":
                return <MultipleChoice 
                    data={data} 
                    timer={timer} 
                    sendMessage={sendMessage}
                    showCorrectAnswer={showCorrectAnswer}
                    correctAnswer={correctAnswer}
                />

            case "freeText":
                return <FreeText 
                    data={data} 
                    timer={timer} 
                    sendMessage={sendMessage}
                    showCorrectAnswer={showCorrectAnswer}
                    correctAnswer={correctAnswer}
                    allUserAnswers={allUserAnswers}
                />

        }
    }

    fetchInitialData();

    if (data) {

        return (
            <Grid container>

                <Grid item xs={0.6} hidden={!isAdmin}>
                    <Logout/>
                </Grid>

                <Grid item xs={isAdmin ? 10.2 : 11}>

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


                                <Grid item xs={6} style={{maxWidth: "150px"}} hidden={!isAdmin}>
                                    <Button 
                                        className="modern-button"
                                        onClick={e => chooseQuestion(e, "previous")}
                                        style={{margin: "1rem"}}>
                                        Previous
                                    </Button>
                                </Grid>

                                <Grid item xs={6} style={{maxWidth: "150px"}} hidden={!isAdmin}>
                                    <Button 
                                        className="modern-button"
                                        onClick={e => chooseQuestion(e, "next")}
                                        style={{margin: "1rem"}}>
                                        Next
                                    </Button>
                                </Grid>

                                <Grid item xs={12} style={{maxWidth: "150px"}} hidden={!isAdmin}>
                                    <Button 
                                        className="modern-button"
                                        onClick={e => startTimer(e)}
                                        style={{margin: "1rem"}}>
                                        Start Timer
                                    </Button>
                                </Grid>

                            </Grid>

                        </div>
                    </div>

                </Grid>

                <Grid item xs={isAdmin ? 1.2 : 1}>
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