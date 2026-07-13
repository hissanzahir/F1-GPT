"use client";
import Image from "next/image";
import F1GPTlogo from "./assets/F1GPTLogo.png"
import { useChat } from "ai/react"
import { Message } from "ai"
import Bubble from "./components/bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/promptSuggestionsRow"

const Home = () => {
    const {append, isLoading, messages,input, handleInputChange, handleSubmit} = useChat()

    const noMessages= false


    return (
        <main>
            <Image className="logo" src={F1GPTlogo} width="250"  alt= "F1GPT Logo"/>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter text">
                            The Ultimate place for Formula One super fans!
                            Ask F1GPT anything about the fantastic topic of F1 racing
                            and it will come back with the most up-to-date answers.
                            We hope you enjoy!
                        </p>
                        <br/>
                        <PromptSuggestionRow/>
                    </>
                ) : (
                    <>
                        {messages.map((messages,index) => <Bubble key={`messages-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me Anything"  />
                    <input type="submit"/>
                </form>
        </main>
    )
}

export default Home
