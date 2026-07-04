"use client";
import Image from "next/image";
import F1GPTlogo from "./assets/F1GPTLogo.png";
import { useChat } from "ai/react"
import { Message } from "ai"

const Home = () => {
    const {append, isLoading, messages,input, handleInputChange, handleSubmit} = useChat()

    const noMessages= true


    return (
        <main>
            <Image src={F1GPTlogo} width="250"  alt= "F1GPT Logo"/>
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
                        {/*<PromptSuggestionRow/>*/}
                    </>
                ) : (
                    <>
                        {/*map messages onto text bubbles */}
                        {/*<LoadingBubble/>*/}
                    </>
                )}

                <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me Anything"  />
                    <input type="submit"/>
                </form>

            </section>
        </main>
    )
}

export default Home
