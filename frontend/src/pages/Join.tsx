import Form from "react-bootstrap/Form";
import React, {useState, useEffect} from "react";
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
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    const eventStartTime = new Date('2025-08-08T16:00:00.000Z'); // 19:00 UTC+3 = 16:00 UTC
    const showLoginScreen = import.meta.env.VITE_SHOW_LOGIN_SCREEN === 'true';

    useEffect(() => {
        if (!showLoginScreen) {
            const timer = setInterval(() => {
                const now = new Date();
                const diff = eventStartTime.getTime() - now.getTime();
                
                if (diff <= 0) {
                    setTimeRemaining('EVENT STARTED!');
                    clearInterval(timer);
                    return;
                }
                
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [showLoginScreen, eventStartTime]);

    const GoToTerms = () => {

        // TODO: This shit !

        return (
            <>
                Piekrītu <Link to={"/terms"}>noteikumiem</Link>
            </>

        )

    }

    const CountdownDisplay = () => {
        // Hide body scrollbars when countdown is showing
        React.useEffect(() => {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            return () => {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            };
        }, []);

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                height: '100vh',
                width: '100vw',
                zIndex: 9999
            }}>
                <div 
                    className={"neon-text-flicker"} 
                    style={{
                        textAlign: 'center',
                        opacity: 0,
                        animation: 'fadeInOnly 4s ease-in forwards'
                    }}
                >
                    FABRIKOTS
                </div>
                <div 
                    className={"neon-text-year"} 
                    style={{
                        textAlign: 'center',
                        opacity: 0,
                        animation: 'fadeInOnly 4s ease-in 0.5s forwards'
                    }}
                >
                    2025
                </div>
                <div style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    position: 'relative',
                    height: '80px'
                }}>
                    <div style={{
                        opacity: 0,
                        animation: 'fadeInOnly 4s ease-in 2s forwards',
                        position: 'absolute',
                        top: '0px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        width: 'max-content'
                    }}>
                        <div style={{
                            fontSize: '2rem',
                            color: '#00ff00',
                            fontFamily: 'monospace',
                            textShadow: '0 0 10px #00ff00'
                        }}>
                            {timeRemaining}
                        </div>
                        {timeRemaining === 'EVENT STARTED!' && (
                            <div style={{
                                marginTop: '20px',
                                fontSize: '1.2rem',
                                color: '#ffffff',
                                opacity: 0,
                                animation: 'fadeInOnly 3s ease-in 0.3s forwards'
                            }}>
                                Fabrikots ir sācies! Refresh now.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const JoinForm = () => {
        // Hide body scrollbars when login form is showing
        React.useEffect(() => {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            return () => {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            };
        }, []);

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '10vh',
                overflow: 'hidden',
                height: '100vh',
                width: '100vw',
                zIndex: 9999
            }}>
                <div className={"neon-text-flicker"} style={{textAlign: 'center'}}>FABRIKOTS</div>
                <div className={"neon-text-year"} style={{textAlign: 'center'}}>2025</div>
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

                        <button className="modern-button" type="submit" disabled={!terms}>
                            Nāc, draudziņ :)
                        </button>
                    </Form>
                </div>
            </div>
        )
    }

    function submitLogin(e: React.FormEvent) {

        e.preventDefault();
        axiosInstance.post(
            "/api/login",
            {
                username: username,
                password: password
            }
        ).then(function () {
            const csrfToken = Cookies.get('csrftoken');
            if (csrfToken) {
                axiosInstance.defaults.headers['X-Csrftoken'] = csrfToken;
            }
            handleState(true);
        }).catch(() => {
           setStatus(false);
           setPassword('');
        });
    }

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={showLoginScreen ? JoinForm() : CountdownDisplay()}/>
                    <Route path="/terms" element={Terms()}/>
                </Routes>
            </BrowserRouter>
        </>
    )

}

export default Join