interface props {
    data: Object
}

function Info({data}: props) {
// data["text"]
    return (
        <>
            <h1>{data["title"]}</h1>
            <div style={{textAlign: "left", marginLeft: "50px", marginTop: "20px"}}
                 dangerouslySetInnerHTML={{__html: data["text"]}}>

            </div>
        </>
    )

}

export default Info;