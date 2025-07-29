import {useState} from "react";

interface props {
    data: Object,
    timer: any,
    sendMessage: any,
    showCorrectAnswer: boolean,
    correctAnswer: string | null
}

function MultipleChoice({data, timer, sendMessage, showCorrectAnswer, correctAnswer}: props) {

    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const answers = data["answers"]["answers"];
    // console.log(data);

    const choseAnswer = (e, answerIdx) => {
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
                {data["title"]}
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
                 dangerouslySetInnerHTML={{__html: data["text"]}}>
            </div>

            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem"
            }}>
                {
                    Object.entries(answers).map((answer, idx) => {
                        let buttonClass = `answer-button`;
                        
                        if (selectedAnswer === idx) {
                            buttonClass += ' selected';
                        }
                        
                        if (showCorrectAnswer && correctAnswer === idx.toString()) {
                            buttonClass += ' correct-answer';
                        }
                        
                        return (
                            <button
                                key={idx}
                                className={buttonClass}
                                disabled={timer === 0 || timer === 30 || showCorrectAnswer}
                                onClick={event => {choseAnswer(event, idx)}}
                                style={{
                                    maxWidth: "500px",
                                    width: "100%"
                                }}>
                                {answer[1]}
                                {showCorrectAnswer && correctAnswer === idx.toString() && 
                                    <span style={{marginLeft: "10px", color: "#00ff00"}}>✓</span>
                                }
                            </button>
                        )
                    })
                }
            </div>
        </div>
    )

}

export default MultipleChoice;