import Button from "react-bootstrap/Button";
import {useState} from "react";

interface props {
    data: Object,
    timer: any,
    sendMessage: any
}

function MultipleChoice({data, timer, sendMessage}: props) {

    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const correctAnswer = data["answers"]["correct"];
    const answers = data["answers"]["answers"];
    // console.log(data);

    const choseAnswer = (e, answerIdx) => {
        // sendMessage(JSON.stringify({"answer_selected": answerIdx}));
        setSelectedAnswer(answerIdx);
    }

    const setFinalAnswer = () => {
        if (timer === 0 && )
    }

    return (
        <>
            <h1>{data["title"]}</h1>
            <div style={{textAlign: "left", marginLeft: "50px", marginTop: "20px", fontSize: "2rem"}}
                 dangerouslySetInnerHTML={{__html: data["text"]}}>
            </div>

            <div style={{marginTop: "10rem"}}>
                {
                    Object.entries(answers).map((answer, idx) => {
                            return (
                                <Button variant="outline-secondary"
                                        disabled={timer === 0 || timer === 30}
                                        onClick={event => {choseAnswer(event, idx)}}
                                        style={{
                                            color: "white",
                                            background: selectedAnswer === idx ? "#888888" : "#5f5757",
                                            border: "solid 1px white",
                                            fontSize: "1.5rem",
                                            margin: "1rem",
                                        }}>
                                    {answer[1]}
                                </Button>
                            )
                        }
                    )
                }
            </div>

        </>
    )

}

export default MultipleChoice;