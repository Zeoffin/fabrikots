import {useState, useEffect} from "react";
import axiosInstance from "../AxiosInstance.tsx";

interface props {
    data: any,
    timer: any,
    sendMessage: any,
    showCorrectAnswer: boolean,
    correctAnswer: string | null,
    voteResults?: any,
    detailedVoteResults?: {[key: string]: string[]} | null
}

function UserChoice({data, timer, sendMessage, showCorrectAnswer, voteResults, detailedVoteResults}: props) {

    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    useEffect(() => {
        // Fetch all users except admin
        axiosInstance.get("/game-info").then(function (res) {
            const users = Object.entries(res.data.response || {})
                .filter(([username]) => username !== "markuss") // Exclude admin
                .map(([username, userInfo]) => ({
                    username,
                    ...userInfo as any
                }));
            setAvailableUsers(users);
        }).catch((e) => {
            console.log("Error fetching users:", e);
        });
    }, []);

    const voteForUser = (username: string) => {
        setSelectedUser(username);
        sendMessage(JSON.stringify({
            "answer": {
                "selected_user": username
            }
        }));
    }

    const renderVoteResults = () => {
        if (!voteResults) return null;

        return (
            <div style={{
                marginTop: "2rem",
                padding: "2rem",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)"
            }}>
                <h2 style={{
                    color: "white",
                    fontSize: "2rem",
                    fontWeight: "700",
                    marginBottom: "1.5rem",
                    textAlign: "center",
                    textShadow: "0 0 20px rgba(0, 255, 170, 0.5)"
                }}>
                    Vote Results
                </h2>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1rem",
                    maxWidth: "1000px",
                    margin: "0 auto"
                }}>
                    {Object.entries(voteResults)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .map(([username, votes]) => {
                            const voters = detailedVoteResults?.[username] || [];
                            
                            return (
                                <div key={username} style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    padding: "1.5rem",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    textAlign: "center",
                                    minHeight: "120px"
                                }}>
                                    <span style={{
                                        color: "#00FFAA",
                                        fontSize: "1.2rem",
                                        fontWeight: "700",
                                        marginBottom: "0.5rem"
                                    }}>
                                        {username}
                                    </span>
                                    <span style={{
                                        color: "white",
                                        fontSize: "1.4rem",
                                        fontWeight: "700",
                                        marginBottom: "1rem"
                                    }}>
                                        {votes as React.ReactNode} vote{(votes as number) !== 1 ? 's' : ''}
                                    </span>
                                    
                                    {voters.length > 0 && (
                                        <div style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "0.3rem",
                                            justifyContent: "center",
                                            marginTop: "auto"
                                        }}>
                                            {voters.map((voter, voterIdx) => (
                                                <span
                                                    key={voterIdx}
                                                    style={{
                                                        background: "rgba(0, 255, 170, 0.2)",
                                                        color: "rgba(0, 255, 170, 0.9)",
                                                        padding: "0.2rem 0.5rem",
                                                        borderRadius: "4px",
                                                        fontSize: "0.8rem",
                                                        border: "1px solid rgba(0, 255, 170, 0.3)"
                                                    }}
                                                >
                                                    {voter}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    };


    return (
        <div style={{padding: "2rem"}}>
            <h1 style={{
                color: "white",
                fontSize: "2.5rem",
                fontWeight: "700",
                marginBottom: "2rem",
                textAlign: "center",
                textShadow: "0 0 20px rgba(0, 255, 170, 0.5)"
            }}>
                {(data as any)["title"]}
            </h1>
            
            <div style={{
                textAlign: "center",
                fontSize: "1.4rem",
                lineHeight: "1.8",
                color: "rgba(255, 255, 255, 0.9)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "2rem",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                marginBottom: "3rem"
            }}
                 dangerouslySetInnerHTML={{__html: (data as any)["text"]}} />

            {(data as any)["image"] && (
                <div style={{ 
                    textAlign: "center",
                    marginBottom: "2rem"
                }}>
                    <img 
                        src={`http://127.0.0.1:8000${(data as any)["image"]}`}
                        alt="Question image"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "400px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
                        }}
                    />
                </div>
            )}

            {!showCorrectAnswer && (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1.5rem"
                }}>
                    <h3 style={{
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "1.5rem",
                        marginBottom: "0.5rem"
                    }}>
                        Vote for a user:
                    </h3>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "1rem",
                        width: "100%",
                        maxWidth: "800px",
                        justifyItems: "center"
                    }}>
                        {
                            availableUsers.map((user) => {
                                let buttonClass = `answer-button`;
                                
                                if (selectedUser === user.username) {
                                    buttonClass += ' selected';
                                }
                                
                                return (
                                    <button
                                        key={user.username}
                                        className={buttonClass}
                                        disabled={timer === 0 || timer === 30 || showCorrectAnswer}
                                        onClick={() => voteForUser(user.username)}
                                        style={{
                                            width: "100%",
                                            maxWidth: "250px",
                                            minHeight: "60px"
                                        }}>
                                        {user.username} ({user.points} points)
                                    </button>
                                )
                            })
                        }
                    </div>
                </div>
            )}

            {showCorrectAnswer && renderVoteResults()}
        </div>
    )
}

export default UserChoice;