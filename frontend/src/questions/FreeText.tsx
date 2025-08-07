import {useState, useEffect} from "react";

interface props {
    data: any,
    timer: any,
    sendMessage: any,
    showCorrectAnswer: boolean,
    correctAnswer: string | null,
    allUserAnswers: Array<{username: string, answer: string, accepted?: boolean}> | null,
    isAdmin?: boolean,
    onAcceptAnswer?: (username: string) => void
}

function FreeText({data, timer, sendMessage, showCorrectAnswer, correctAnswer, allUserAnswers, isAdmin, onAcceptAnswer}: props) {

    const [userAnswer, setUserAnswer] = useState("");

    // Submit answer when timer reaches 0
    useEffect(() => {
        if (timer === 0) {
            console.log(`Submitting freeText answer: "${userAnswer}"`);
            sendMessage(JSON.stringify({
                "answer": {
                    "text_answer": userAnswer
                }
            }));
        }
    }, [timer, userAnswer, sendMessage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const answer = e.target.value;
        setUserAnswer(answer);
        // Removed real-time answer sending - only submit when timer reaches 0
    }

    return (
        <div style={{padding: "2rem"}}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1 style={{
                    color: "white",
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    marginBottom: "1rem",
                    textShadow: "0 0 20px rgba(0, 255, 170, 0.5)"
                }}>
                    {(data as any)["title"]}
                </h1>
                <div style={{
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "1.2rem",
                    fontWeight: "600"
                }}>
                    <span>{(data as any)["points"]} {(data as any)["points"] === 1 ? 'punkts' : 'punkti'}</span>
                </div>
            </div>
            
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

            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem"
            }}>
                {showCorrectAnswer && allUserAnswers ? (
                    <div style={{
                        width: "100%",
                        maxWidth: "800px"
                    }}>
                        <h3 style={{
                            color: "rgba(0, 255, 170, 0.9)",
                            fontSize: "1.5rem",
                            fontWeight: "700",
                            marginBottom: "1.5rem",
                            textAlign: "center",
                            textTransform: "uppercase",
                            letterSpacing: "1px"
                        }}>
                            Atbildes
                        </h3>
                        
                        <div style={{
                            display: "grid",
                            gap: "1rem",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
                        }}>
                            {allUserAnswers.map((userAnswer, index) => (
                                <div key={index} 
                                     onClick={() => isAdmin && onAcceptAnswer && !userAnswer.accepted ? onAcceptAnswer(userAnswer.username) : null}
                                     style={{
                                    padding: "1rem",
                                    background: userAnswer.accepted ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 255, 255, 0.05)",
                                    border: userAnswer.accepted ? "1px solid rgba(0, 255, 0, 0.5)" : "1px solid rgba(0, 255, 170, 0.2)",
                                    borderRadius: "12px",
                                    backdropFilter: "blur(10px)",
                                    cursor: isAdmin && !userAnswer.accepted ? "pointer" : "default",
                                    transition: "all 0.3s ease",
                                    position: "relative"
                                }}
                                onMouseEnter={(e) => {
                                    if (isAdmin && !userAnswer.accepted) {
                                        const target = e.currentTarget as HTMLDivElement;
                                        target.style.transform = "scale(1.02)";
                                        target.style.boxShadow = "0 0 20px rgba(0, 255, 170, 0.3)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isAdmin && !userAnswer.accepted) {
                                        const target = e.currentTarget as HTMLDivElement;
                                        target.style.transform = "scale(1)";
                                        target.style.boxShadow = "none";
                                    }
                                }}
                                >
                                    {userAnswer.accepted && (
                                        <div style={{
                                            position: "absolute",
                                            top: "0.5rem",
                                            right: "0.5rem",
                                            color: "rgba(0, 255, 0, 0.9)",
                                            fontSize: "1.2rem",
                                            fontWeight: "bold"
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                    <div style={{
                                        color: userAnswer.accepted ? "rgba(0, 255, 0, 0.9)" : "rgba(0, 255, 170, 0.9)",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        marginBottom: "0.5rem"
                                    }}>
                                        {userAnswer.username}
                                    </div>
                                    <div style={{
                                        color: "rgba(255, 255, 255, 0.9)",
                                        fontSize: "1rem",
                                        lineHeight: "1.4",
                                        wordBreak: "break-word"
                                    }}>
                                        {userAnswer.answer}
                                    </div>
                                    {isAdmin && !userAnswer.accepted && (
                                        <div style={{
                                            marginTop: "0.5rem",
                                            fontSize: "0.8rem",
                                            color: "rgba(255, 255, 255, 0.6)",
                                            fontStyle: "italic"
                                        }}>
                                            Click to accept and award points
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {correctAnswer && (
                            <div style={{
                                marginTop: "2rem",
                                padding: "1rem",
                                background: "rgba(0, 255, 0, 0.1)",
                                border: "1px solid rgba(0, 255, 0, 0.3)",
                                borderRadius: "8px",
                                color: "rgba(0, 255, 0, 0.9)",
                                textAlign: "center",
                                fontSize: "1.1rem"
                            }}>
                                <strong>Correct Answer:</strong> {correctAnswer}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <textarea
                            value={userAnswer}
                            onChange={handleInputChange}
                            disabled={timer === 0 || showCorrectAnswer}
                            placeholder="Raksti atbildi šeit..."
                            maxLength={100}
                            style={{
                                width: "100%",
                                maxWidth: "600px",
                                minHeight: "120px",
                                padding: "1rem",
                                fontSize: "1.1rem",
                                background: "rgba(255, 255, 255, 0.1)",
                                border: "2px solid rgba(0, 255, 170, 0.3)",
                                borderRadius: "12px",
                                color: "white",
                                resize: "vertical",
                                outline: "none",
                                backdropFilter: "blur(10px)",
                                transition: "all 0.3s ease"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "rgba(0, 255, 170, 0.8)";
                                e.target.style.boxShadow = "0 0 20px rgba(0, 255, 170, 0.3)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "rgba(0, 255, 170, 0.3)";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                        
                        {showCorrectAnswer && correctAnswer && !allUserAnswers && (
                            <div style={{
                                marginTop: "1rem",
                                padding: "1rem",
                                background: "rgba(0, 255, 0, 0.1)",
                                border: "1px solid rgba(0, 255, 0, 0.3)",
                                borderRadius: "8px",
                                color: "rgba(0, 255, 0, 0.9)",
                                textAlign: "center",
                                fontSize: "1.1rem"
                            }}>
                                <strong>Correct Answer:</strong> {correctAnswer}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )

}

export default FreeText;