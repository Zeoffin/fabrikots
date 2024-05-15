import {Box, Button, Grid} from "@mui/material";
import {useEffect, useState, useCallback} from "react";
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
    isStaff: boolean
}

function UserPoints({isStaff}: Props) {

    const [userPoints, setUserPoints] = useState(noUsers);
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
        axiosInstance.get("/game-info")
            .then(function (res) {
                console.log("NEW GAME INFO:");
                console.log(res.data);
                setUserPoints(res.data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }, [lastMessage]);

    useEffect(() => {
        console.log("MSG Received:");
        console.log(lastMessage);
    }, [lastMessage]);

    const changePoint = useCallback( (e, user, addPoint) => {
        e.preventDefault();
        const point_change = {
            "user": user,
            "add_point": addPoint
        }
        sendMessage(JSON.stringify({"points": point_change}));

    }, [])

    // https://medium.com/@ismailtaufiq19/display-objects-key-value-pairs-in-reactjs-95d8a26bd74b
    const setupUsers = () => {

        if (isStaff) {

            return (
                Object.keys(userPoints.response).map((key, index) => (
                    <>
                        <Grid container key={key} className={"user-row"}>

                            <Grid item xs={8}>
                                {key}:
                            </Grid>

                            <Grid item xs={1}>
                                <Button className={"change-points"}
                                        onClick={(e) => changePoint(e, key, false)}
                                        disabled={readyState !== ReadyState.OPEN}>-</Button>
                            </Grid>

                            <Grid item xs={2}>
                                {userPoints.response[key]['points']}
                            </Grid>

                            <Grid item xs={1}>
                                {/*<Button className={"change-points"} onClick={(e) => addPoint(key)}>+</Button>*/}
                                <Form onSubmit={e => changePoint(e, key, true)}>
                                    <Button className={"change-points"} type={"submit"}
                                            disabled={readyState !== ReadyState.OPEN}>+</Button>
                                </Form>
                            </Grid>

                        </Grid>
                    </>
                ))
            )

        } else {

            return (
                Object.keys(userPoints.response).map((key, index) => (
                    <>
                        <Grid container key={key} className={"user-row"}>

                            <Grid item xs={8}>
                                {key}:
                            </Grid>

                            <Grid item xs={2}>
                                {userPoints.response[key]['points']}
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
                    <b style={{marginLeft: "32%"}}>Points</b>
                </Grid>
                {setupUsers()}
            </Grid>
        </Box>

    )

}

export default UserPoints