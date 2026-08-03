"use client";
import { useState } from "react";
import Image from "next/image";
import F1GPTlogo from "./assets/F1GPTLogo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionRow from "./components/PromptSuggestionsRow";
import SidebarAuth from "./components/SidebarAuth";
import { getSuggestedAnswer } from "./data/suggestedAnswers";

const SUGGESTION_DELAY_MS = 500;

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit, setMessages } = useChat();
    const [pendingSuggestion, setPendingSuggestion] = useState(false);

    const noMessages = !messages || messages.length === 0;

    const handlePrompt = (promptText: string) => {
        const saved = getSuggestedAnswer(promptText);
        if (saved) {
            setPendingSuggestion(true);
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), content: promptText, role: "user" },
            ]);
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), content: saved, role: "assistant" },
                ]);
                setPendingSuggestion(false);
            }, SUGGESTION_DELAY_MS);
            return;
        }

        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user",
        };
        append(msg);
    };

    const handleNewChat = () => {
        setMessages([]);
    };

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <Image className="logo" src={F1GPTlogo} width={140} alt="F1GPT Logo" />
                    <p className="sidebar-caption">Your Formula 1 co-pilot</p>
                </div>

                <button className="sidebar-primary" onClick={handleNewChat} type="button">
                    + New chat
                </button>

                <div className="sidebar-section">
                    <p className="section-label">Quick access</p>
                    <button className="sidebar-link" type="button">Recent chats</button>
                </div>

                <div className="sidebar-footer">
                    <SidebarAuth />
                </div>
            </aside>

            <main className="chat-panel">

                <section className={`messages-area ${noMessages ? "empty" : "populated"}`}>
                    {noMessages ? (
                        <div className="welcome-card">
                            <p className="welcome-title">Ask anything about Formula One.</p>
                            <p className="welcome-text">
                                From race strategy and driver form to history, predictions, and team news,
                                F1GPT delivers sharp, current answers in a clean and conversational experience.
                            </p>
                            <PromptSuggestionRow onPromptClick={handlePrompt} />
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <Bubble key={`message-${index}`} message={message} />
                            ))}
                            {(isLoading || pendingSuggestion) && <LoadingBubble />}
                        </>
                    )}
                </section>

                <form className="composer" onSubmit={handleSubmit}>
                    <input
                        className="question-box"
                        onChange={handleInputChange}
                        value={input}
                        placeholder="Ask F1GPT anything..."
                    />
                    <button className="send-button" type="submit">
                        Send
                    </button>
                </form>
            </main>
        </div>
    );
};

export default Home;
