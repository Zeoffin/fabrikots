import '../App.css'
import UserPoints from "../components/UserPoints.tsx";
import axiosInstance from "../AxiosInstance.tsx";
import useWebSocket from "react-use-websocket";
import {Grid} from "@mui/material";
import Logout from "../components/Logout.tsx";
import {useEffect, useState} from "react";
import {Button} from "@mui/material";
import Info from "../questions/Info.tsx";
import {pointsSocket} from "../../WebSockets.tsx";
import MultipleChoice from "../questions/MultipleChoice.tsx";
import FreeText from "../questions/FreeText.tsx";
import UserChoice from "../questions/UserChoice.tsx";
import WheelSpin from "../components/WheelSpin.tsx";
import WheelDisplay from "../components/WheelDisplay.tsx";
import Leaderboard from "../components/Leaderboard.tsx";

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
    const [data, setData] = useState(null);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [timerStarted, setTimerStarted] = useState(false);
    const [allUserAnswers, setAllUserAnswers] = useState<any[] | null>(null);
    const [voteResults, setVoteResults] = useState(null);
    const [detailedVoteResults, setDetailedVoteResults] = useState(null);
    const [multipleChoiceResults, setMultipleChoiceResults] = useState(null);
    const [userPoints, setUserPoints] = useState(null);
    const [quizEnded, setQuizEnded] = useState(false);
    const {sendMessage, lastMessage, readyState} = useWebSocket(pointsSocket);


    // TODO: Websockets - https://www.npmjs.com/package/react-use-websocket

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
                setVoteResults(null);
                setDetailedVoteResults(null);
                setMultipleChoiceResults(null);
                // Refresh user points after direction change to maintain wheel user list
                if (isAdmin) {
                    getUserPoints();
                }
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
                if (messageData["question_type"] === "userChoice" && messageData["vote_results"]) {
                    setVoteResults(messageData["vote_results"]);
                }
                if (messageData["question_type"] === "userChoice" && messageData["detailed_vote_results"]) {
                    setDetailedVoteResults(messageData["detailed_vote_results"]);
                }
                if (messageData["question_type"] === "multipleChoice" && messageData["multiple_choice_results"]) {
                    setMultipleChoiceResults(messageData["multiple_choice_results"]);
                }
                // Update userPoints to maintain wheel user list after timer ends
                if (messageData["user_points"]) {
                    setUserPoints({ response: messageData["user_points"] });
                }
            }

            if (messageData["type"] === "answer_accepted") {
                // Update the accepted status in allUserAnswers
                if (allUserAnswers) {
                    const updatedAnswers = (allUserAnswers as any[]).map((userAnswer: any) => {
                        if (userAnswer.username === messageData["accepted_username"]) {
                            return { ...userAnswer, accepted: true };
                        }
                        return userAnswer;
                    });
                    setAllUserAnswers(updatedAnswers);
                }
            }

            // Handle manual point changes to maintain wheel user list
            if (messageData["type"] === "points") {
                if (messageData["user_points"]) {
                    setUserPoints({ response: messageData["user_points"] });
                }
            }

            if (messageData["type"] === "wheelspin_result") {
                // Update user points after wheelspin action
                if (messageData["user_points"]) {
                    setUserPoints({ response: messageData["user_points"] });
                }
            }

            // Handle quiz end
            if (messageData["type"] === "quiz_ended") {
                setQuizEnded(true);
                if (messageData["user_points"]) {
                    setUserPoints({ response: messageData["user_points"] });
                }
            }

            // Update userPoints from various message types (fallback)
            if (messageData["user_points"]) {
                setUserPoints({ response: messageData["user_points"] });
            }

        }

    }, [lastMessage]);

    const fetchInitialData = () => {
        if (!data) {
            getQuestion();
        }
        if (!userPoints && isAdmin) {
            getUserPoints();
        }
    }

    const getUserPoints = () => {
        axiosInstance.get("/game-info")
            .then(function (res) {
                setUserPoints(res.data);
            })
            .catch(function (error) {
                console.log("Error fetching user points:", error);
            });
    }

    // ===================================================================================          Timer

    const startTimer = (_e: React.MouseEvent) => {
        sendMessage(JSON.stringify({"start_timer": data?.["time"]}));
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

    const chooseQuestion = (_e: React.MouseEvent, direction: string) => {
        sendMessage(JSON.stringify({"direction": direction}));
    }

    const acceptAnswer = (username: string) => {
        if (isAdmin && question) {
            sendMessage(JSON.stringify({
                "accept_answer": {
                    "username": username,
                    "question_id": question
                }
            }));
        }
    }

    const deleteAnswersForCurrentQuestion = () => {
        if (isAdmin && question) {
            axiosInstance.post("/delete-answers", {
                question_id: question
            }).then(function (res) {
                console.log("Deleted answers for question", question);
                console.log(res.data);
            }).catch((e) => {
                console.error("Error deleting answers:", e);
            });
        }
    }


    // ===================================================================================      RENDER STUFF

    const renderTimer = () => {
        // Don't show timer for info questions with time = -1
        if (data?.["type"] === "info" && data?.["time"] === -1) {
            return null;
        }

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

        if (data && "time" in data && parseInt(data["time"]) > -1) {
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
            // Skip displaying question numbers for the first two questions
            if (question <= 2) {
                return null;
            }
            
            // Start numbering from question 3 as "Question 1"
            const displayNumber = question - 2;
            
            return (
                <h4 style={{
                    color: 'rgba(0, 255, 170, 0.9)',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}>
                    Question {displayNumber}
                </h4>
            )
        }
    }

    const renderAdminInfo = () => {
        if (isAdmin && data && data["notes"]) {
            return (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "20px",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "rgba(255, 255, 255, 0.9)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0, 255, 170, 0.3)",
                    maxWidth: "300px",
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    zIndex: 1000,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
                }}>
                    <div style={{
                        color: "rgba(0, 255, 170, 0.9)",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "6px"
                    }}>
                        Admin Info
                    </div>
                    {data["notes"]}
                </div>
            )
        }
    }

    const renderQuestion = () => {
        // Show leaderboard if quiz has ended
        if (quizEnded && userPoints) {
            return <Leaderboard userPoints={userPoints} />;
        }

        // For info questions with time = -1, show the info immediately
        if (data?.["type"] === "info" && data?.["time"] === -1) {
            return <Info data={data}/>
        }

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
                        {data?.["title"]}
                    </h1>
                </div>
            );
        }

        if (!data?.["type"]) {
            return null;
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
                    multipleChoiceResults={multipleChoiceResults}
                    currentQuestionId={question}
                />

            case "freeText":
                return <FreeText 
                    data={data} 
                    timer={timer} 
                    sendMessage={sendMessage}
                    showCorrectAnswer={showCorrectAnswer}
                    correctAnswer={correctAnswer}
                    allUserAnswers={allUserAnswers}
                    isAdmin={isAdmin}
                    onAcceptAnswer={acceptAnswer}
                    currentQuestionId={question}
                />

            case "userChoice":
                return <UserChoice 
                    data={data} 
                    timer={timer} 
                    sendMessage={sendMessage}
                    showCorrectAnswer={showCorrectAnswer}
                    correctAnswer={correctAnswer}
                    voteResults={voteResults}
                    detailedVoteResults={detailedVoteResults}
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


                                <Grid item xs={12} hidden={!isAdmin || quizEnded}>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "1rem",
                                        padding: "1rem",
                                        // backgroundColor: "rgba(0, 0, 0, 0.3)",
                                        // borderRadius: "10px",
                                        // border: "1px solid rgba(0, 255, 170, 0.3)",
                                        marginTop: "2rem"
                                    }}>
                                        <div style={{
                                            display: "flex",
                                            gap: "0.5rem"
                                        }}>
                                            <Button 
                                                className="modern-button"
                                                onClick={e => chooseQuestion(e, "previous")}
                                                style={{
                                                    minWidth: "100px",
                                                    fontSize: "0.9rem",
                                                    color: "white",
                                                    background: "#0175c7",
                                                }}>
                                                Previous
                                            </Button>
                                            <Button 
                                                className="modern-button"
                                                onClick={e => chooseQuestion(e, "next")}
                                                style={{
                                                    minWidth: "100px",
                                                    fontSize: "0.9rem",
                                                    color: "white",
                                                    background: "#0175c7",
                                                }}>
                                                Next
                                            </Button>
                                        </div>
                                        
                                        <Button 
                                            className="modern-button"
                                            onClick={e => startTimer(e)}
                                            style={{
                                                minWidth: "120px",
                                                fontSize: "0.9rem",
                                                background: "#00aa55",
                                                color: "white"
                                            }}>
                                            Start Timer
                                        </Button>
                                        
                                        <Button 
                                            className="modern-button"
                                            onClick={deleteAnswersForCurrentQuestion}
                                            style={{
                                                minWidth: "140px",
                                                fontSize: "0.9rem",
                                                background: "#ff4444",
                                                color: "white",
                                            }}>
                                            Delete answers
                                        </Button>
                                    </div>
                                </Grid>

                            </Grid>

                        </div>
                    </div>

                </Grid>

                <Grid item xs={isAdmin ? 1.2 : 1}>
                    <UserPoints lastMessage={lastMessage} sendMessage={sendMessage} readyState={readyState}
                                isStaff={isAdmin} currentQuestionId={question}/>
                </Grid>

                {renderAdminInfo()}

                {isAdmin && userPoints && !quizEnded && (
                    <WheelSpin 
                        userPoints={userPoints} 
                        sendMessage={sendMessage} 
                        readyState={readyState}
                        lastMessage={lastMessage}
                    />
                )}

                <WheelDisplay lastMessage={lastMessage} />

            </Grid>

        )
    } else {
        return (
            "Still loading ngr..."
        )
    }
}

export default Home