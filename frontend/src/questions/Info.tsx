interface props {
    data: Object
}

function Info({data}: props) {
    const hasText = data["text"] && data["text"].trim() !== "";
    
    if (!hasText) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "30rem"
            }}>
                <h1 style={{
                    color: "white",
                    fontSize: "3rem",
                    fontWeight: "700",
                    textAlign: "center",
                    textShadow: "0 0 20px rgba(0, 255, 170, 0.5)"
                }}>
                    {data["title"]}
                </h1>
            </div>
        );
    }
    
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
                textAlign: "left",
                fontSize: "1.3rem",
                lineHeight: "1.8",
                color: "rgba(255, 255, 255, 0.9)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "2rem",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)"
            }}
                 dangerouslySetInnerHTML={{__html: data["text"]}}>
            </div>
        </div>
    )
}

export default Info;