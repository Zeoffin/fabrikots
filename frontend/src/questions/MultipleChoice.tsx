import {useState} from "react";

interface props {
    data: any,
    timer: any,
    sendMessage: any,
    showCorrectAnswer: boolean,
    correctAnswer: string | null,
    multipleChoiceResults?: {[key: string]: string[]} | null
}

function MultipleChoice({data, timer, sendMessage, showCorrectAnswer, correctAnswer, multipleChoiceResults}: props) {

    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const answers = (data as any)["answers"]["answers"];
    // console.log(data);

    const choseAnswer = (_e: React.MouseEvent, answerIdx: number) => {
        setSelectedAnswer(answerIdx);
        sendMessage(JSON.stringify({
            "answer": {
                "selected_answer": answerIdx
            }
        }));
    }

    // const setFinalAnswer = () => {
    //     if (timer === 0 && )
    // }

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

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.5rem",
                maxWidth: "800px",
                margin: "0 auto"
            }}>
                {
                    Object.entries(answers).map((answer, idx) => {
                        let buttonClass = `answer-button`;
                        const playersForThisChoice = multipleChoiceResults?.[idx.toString()] || [];
                        const isCorrectAnswer = correctAnswer === idx.toString();
                        
                        if (selectedAnswer === idx) {
                            buttonClass += ' selected';
                        }
                        
                        if (showCorrectAnswer && isCorrectAnswer) {
                            buttonClass += ' correct-answer';
                        }
                        
                        return (
                            <button
                                key={idx}
                                className={buttonClass}
                                disabled={timer === 0 || timer === 30 || showCorrectAnswer}
                                onClick={event => {choseAnswer(event, idx)}}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: showCorrectAnswer && playersForThisChoice.length > 0 ? "0.8rem" : "0"
                                }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                }}>
                                    {(answer as any)[1]}
                                    {showCorrectAnswer && isCorrectAnswer && 
                                        <span style={{color: "#00ff00"}}>✓</span>
                                    }
                                    {showCorrectAnswer && playersForThisChoice.length > 0 && (
                                        <span style={{
                                            color: "rgba(255, 255, 255, 0.7)",
                                            fontSize: "0.9rem"
                                        }}>
                                            ({playersForThisChoice.length})
                                        </span>
                                    )}
                                </div>
                                
                                {showCorrectAnswer && playersForThisChoice.length > 0 && (
                                    <div style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "0.3rem",
                                        justifyContent: "center",
                                        marginTop: "auto"
                                    }}>
                                        {playersForThisChoice.map((username, playerIdx) => (
                                            <span
                                                key={playerIdx}
                                                style={{
                                                    background: "rgba(0, 255, 170, 0.2)",
                                                    color: "rgba(0, 255, 170, 0.9)",
                                                    padding: "0.2rem 0.4rem",
                                                    borderRadius: "3px",
                                                    fontSize: "0.75rem",
                                                    border: "1px solid rgba(0, 255, 170, 0.3)"
                                                }}
                                            >
                                                {username}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </button>
                        )
                    })
                }
            </div>

        </div>
    )

}

export default MultipleChoice;