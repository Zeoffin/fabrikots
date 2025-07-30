import {Box, Button, Grid} from "@mui/material";
import {useEffect, useState, useCallback, useRef} from "react";
import axiosInstance from "../AxiosInstance.tsx";
import Form from "react-bootstrap/Form";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {pointsSocket} from "../../WebSockets.tsx";

const noUsers = {
    "response": {
        "no users": {
            "points": 0
        }
    }
}

interface Props {
    isStaff: boolean,
    sendMessage: any,
    lastMessage: any,
    readyState: any
}

function UserPoints({isStaff, sendMessage, lastMessage, readyState}: Props) {

    const [userPoints, setUserPoints] = useState(noUsers);
    const [pointGlows, setPointGlows] = useState<{[key: string]: 'increase' | 'decrease' | null}>({});
    const previousPointsRef = useRef<{[key: string]: number}>({});

    const updatePointsWithGlow = (newPointsData: any) => {
        const newGlows: {[key: string]: 'increase' | 'decrease' | null} = {};
        
        Object.keys(newPointsData.response).forEach(username => {
            const newPoints = newPointsData.response[username].points;
            const oldPoints = previousPointsRef.current[username];
            
            if (oldPoints !== undefined && newPoints !== oldPoints) {
                newGlows[username] = newPoints > oldPoints ? 'increase' : 'decrease';
                
                setTimeout(() => {
                    setPointGlows(prev => ({...prev, [username]: null}));
                }, 1000);
            }
        });
        
        previousPointsRef.current = Object.keys(newPointsData.response).reduce((acc, username) => {
            acc[username] = newPointsData.response[username].points;
            return acc;
        }, {} as {[key: string]: number});
        
        setPointGlows(newGlows);
        setUserPoints(newPointsData);
    };

    useEffect(() => {

        if (lastMessage) {
            const messageData = JSON.parse(lastMessage["data"]);
            if ("points" in messageData && messageData["user_points"]) {
                // Update points directly from WebSocket message for manual changes
                updatePointsWithGlow({
                    response: messageData["user_points"]
                });
            } else if ("points" in messageData) {
                // Fallback to API call if no user_points data
                getGameInfo();
            } else if (messageData["type"] === "timer_ended" && messageData["user_points"]) {
                // Update points directly from WebSocket message for timer end
                updatePointsWithGlow({
                    response: messageData["user_points"]
                });
            } else if (messageData["type"] === "answer_accepted" && messageData["user_points"]) {
                // Update points directly from WebSocket message when answers are accepted
                updatePointsWithGlow({
                    response: messageData["user_points"]
                });
            }
        } else if (userPoints === noUsers) {
            getGameInfo();
        }

    }, [lastMessage]);

    const getGameInfo = () => {
        axiosInstance.get("/game-info")
            .then(function (res) {
                // console.log("NEW GAME INFO:");
                // console.log(res.data);
                updatePointsWithGlow(res.data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    // useEffect(() => {
    //     console.log("MSG Received:");
    //     console.log(lastMessage);
    // }, [lastMessage]);

    const changePoint = useCallback((e, user, addPoint) => {
        e.preventDefault();
        const point_change = {
            "user": user,
            "add_point": addPoint
        }
        sendMessage(JSON.stringify({"points": point_change}));

    }, [])

    // https://medium.com/@ismailtaufiq19/display-objects-key-value-pairs-in-reactjs-95d8a26bd74b
    const setupUsers = () => {

        // Sort users by points in descending order
        const sortedUsers = Object.keys(userPoints.response)
            .sort((a, b) => userPoints.response[b]['points'] - userPoints.response[a]['points']);

        if (isStaff) {

            return (
                sortedUsers.map((key, index) => (
                    <div key={key} className="admin-user-row" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        margin: '4px 0',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                    }}>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '11px',
                            fontWeight: '500',
                            minWidth: '40px',
                            maxWidth: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {key}
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                        }}>
                            <button 
                                onClick={(e) => changePoint(e, key, false)}
                                disabled={readyState !== ReadyState.OPEN}
                                style={{
                                    background: 'rgba(255, 75, 87, 0.8)',
                                    border: '1px solid rgba(255, 75, 87, 0.5)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '2px 4px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '18px',
                                    height: '18px'
                                }}
                                onMouseOver={(e) => {
                                    if (!e.target.disabled) {
                                        e.target.style.background = 'rgba(255, 75, 87, 1)';
                                        e.target.style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'rgba(255, 75, 87, 0.8)';
                                    e.target.style.transform = 'scale(1)';
                                }}>
                                −
                            </button>

                            <div style={{
                                color: 'rgba(0, 255, 170, 0.9)',
                                fontSize: '11px',
                                fontWeight: '700',
                                minWidth: '16px',
                                textAlign: 'center',
                                background: 'rgba(0, 255, 170, 0.1)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease',
                                boxShadow: pointGlows[key] === 'increase' 
                                    ? '0 0 15px rgba(0, 255, 170, 0.8), 0 0 25px rgba(0, 255, 170, 0.5)' 
                                    : pointGlows[key] === 'decrease' 
                                    ? '0 0 15px rgba(255, 75, 87, 0.8), 0 0 25px rgba(255, 75, 87, 0.5)' 
                                    : 'none',
                                transform: pointGlows[key] ? 'scale(1.1)' : 'scale(1)'
                            }}>
                                {userPoints.response[key]['points']}
                            </div>

                            <Form onSubmit={e => changePoint(e, key, true)} style={{margin: 0}}>
                                <button 
                                    type="submit"
                                    disabled={readyState !== ReadyState.OPEN}
                                    style={{
                                        background: 'rgba(0, 255, 170, 0.8)',
                                        border: '1px solid rgba(0, 255, 170, 0.5)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        padding: '2px 4px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        minWidth: '18px',
                                        height: '18px'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!e.target.disabled) {
                                            e.target.style.background = 'rgba(0, 255, 170, 1)';
                                            e.target.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'rgba(0, 255, 170, 0.8)';
                                        e.target.style.transform = 'scale(1)';
                                    }}>
                                    +
                                </button>
                            </Form>
                        </div>
                    </div>
                ))
            )

        } else {

            return (
                sortedUsers.map((key, index) => (
                    <>
                        <Grid container key={key} className={"user-row"}>

                            <Grid item xs={8}>
                                {key}:
                            </Grid>

                            <Grid item xs={2}>
                                <span style={{
                                    transition: 'all 0.3s ease',
                                    display: 'inline-block',
                                    textShadow: pointGlows[key] === 'increase' 
                                        ? '0 0 10px rgba(0, 255, 170, 0.8), 0 0 20px rgba(0, 255, 170, 0.5)' 
                                        : pointGlows[key] === 'decrease' 
                                        ? '0 0 10px rgba(255, 75, 87, 0.8), 0 0 20px rgba(255, 75, 87, 0.5)' 
                                        : 'none',
                                    transform: pointGlows[key] ? 'scale(1.1)' : 'scale(1)',
                                    color: pointGlows[key] === 'increase' 
                                        ? 'rgba(0, 255, 170, 1)' 
                                        : pointGlows[key] === 'decrease' 
                                        ? 'rgba(255, 75, 87, 1)' 
                                        : 'inherit'
                                }}>
                                    {userPoints.response[key]['points']}
                                </span>
                            </Grid>

                        </Grid>
                    </>
                ))
            )

        }
    }

    return (
        <Box className={"user-points contrast"}>
            <Grid container>
                <Grid item xs={12} className={"center"}>
                    <h3 style={{
                        color: 'rgba(0, 255, 170, 0.9)',
                        margin: '0 0 1rem 0',
                        fontSize: '1.2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        textAlign: 'center'
                    }}>
                        Points
                    </h3>
                </Grid>
                {setupUsers()}
            </Grid>
        </Box>
    )

}

export default UserPoints