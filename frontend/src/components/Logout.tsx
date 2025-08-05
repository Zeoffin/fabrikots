import {Button} from "@mui/material";
import axiosInstance from "../AxiosInstance.tsx";
import Form from "react-bootstrap/Form";

function Logout() {

    function submitLogout(e: React.FormEvent) {
        e.preventDefault();
        axiosInstance.post(
            "/api/logout",
            {withCredentials: true}
        ).then(function () {
            localStorage.removeItem('sessionid');
            localStorage.removeItem('csrftoken');

        });
    }

    return (
        <>
            <Form onSubmit={e => submitLogout(e)}>
                <Button variant={"outlined"} type={"submit"} className={"ej-ara"} >Ej ārā</Button>
            </Form>
        </>
    )

}

export default Logout