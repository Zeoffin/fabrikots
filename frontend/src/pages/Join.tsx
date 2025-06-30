import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {useState} from "react";
import Terms from "./Terms.tsx";
import {BrowserRouter, Link, Route, Routes} from "react-router-dom";
import axiosInstance from "../AxiosInstance.tsx";
import Cookies from 'js-cookie';

interface Props {
    handleState: (currentUser: boolean) => void
}

function Join({handleState}: Props) {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState(true);
    const [terms, setTerms] = useState(false);

    const GoToTerms = () => {

        // TODO: This shit !

        return (
            <>
                Piekrītu <Link to={"/terms"}>noteikumiem</Link>
            </>

        )

    }

    const JoinForm = () => {
        return (
            <>
                <div className={"neon-text-flicker"}>FABRIKOTS</div>
                <div className="join-form">
                    <p style={{color: "red"}} hidden={status}>Nepareizi ierakstīji</p>
                    <Form onSubmit={e => submitLogin(e)}>
                        <Form.Group className="mb-3 spacing_login" controlId="formBasicEmail">
                            <Form.Control type="username" placeholder="username" value={username}
                                          onChange={e => setUsername(e.target.value)}/>
                            <Form.Text className="text-muted">
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3 spacing_login" controlId="formBasicPassword">
                            <Form.Control type="password" placeholder="pw" value={password}
                                          onChange={e => setPassword(e.target.value)}/>
                        </Form.Group>

                        <Form.Group className="mb-3 spacing_login" controlId="formBasicCheckbox">
                            <Form.Check type="checkbox" label={GoToTerms()} onChange={e => setTerms(e.target.checked)}/>
                        </Form.Group>

                        <Button variant="outline-primary" type="submit" disabled={!terms}>
                            Nāc, draudziņ :)
                        </Button>
                    </Form>
                </div>
            </>
        )
    }

    function submitLogin(e) {

        e.preventDefault();
        axiosInstance.post(
            "/api/login",
            {
                username: username,
                password: password
            }
        ).then(function (res) {
            axiosInstance.defaults.headers['X-Csrftoken'] = Cookies.get('csrftoken');
            handleState(true);
        }).catch((e) => {
           setStatus(false);
           setPassword('');
        });
    }

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={JoinForm()}/>
                    <Route path="/terms" element={Terms()}/>
                </Routes>
            </BrowserRouter>
        </>
    )

}

export default Join