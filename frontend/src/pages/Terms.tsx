import TermsText from "./TermsText.tsx";
import {Button} from "@mui/material";
import {Link} from "react-router-dom";

function Terms() {

    return (
        <>
            <div id={"back-button"}>
                <Link to={"/"}>
                    <Button variant="outlined">Atpakaļ</Button>
                </Link>
            </div>

            <div style={{textAlign: "left"}}>
                <TermsText/>
            </div>
        </>
    )

}

export default Terms