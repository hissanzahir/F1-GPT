"use client";
import Link from "next/link";
import Image from "next/image";
import F1GPTlogo from "./assets/F1GPTLogo.png";

export default function LandingPage() {
    return (
        <div className="landing-shell">
            <nav className="landing-nav">
                <div className="nav-brand">
                    <Link href="/">
                        <Image src={F1GPTlogo} width={140} alt="F1GPT Logo" />
                    </Link>
                </div>
                <div className="nav-links">
                    <Link href="/chat" className="nav-link primary">
                        Start Chatting
                    </Link>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-content">
                    <p className="hero-eyebrow">Powered by AI</p>
                    <h1 className="hero-title">
                        Your Formula 1
                        <br />
                        <span className="hero-title-accent">Co-Pilot</span>
                    </h1>
                    <p className="hero-subtitle">
                        Race strategy, driver stats, predictions, and team news —
                        answered instantly by F1GPT.
                    </p>
                    <div className="hero-ctas">
                        <Link href="/chat" className="hero-cta primary">
                            Try F1GPT
                        </Link>
                        <Link href="/signup" className="hero-cta secondary">
                            Sign Up Free
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card">
                        <div className="hero-card-header">
                            <span className="hero-card-dot red"></span>
                            <span className="hero-card-dot yellow"></span>
                            <span className="hero-card-dot green"></span>
                        </div>
                        <div className="hero-card-body">
                            <p className="hero-card-question">
                                Who is the current F1 World Champion?
                            </p>
                            <p className="hero-card-answer">
                                Max Verstappen — 4 consecutive titles (2021–2024)
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features">
                <h2 className="features-title">Everything you need to know about F1</h2>
                <p className="features-subtitle">
                    From race weekends to driver contracts, F1GPT covers it all.
                </p>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        </div>
                        <h3 className="feature-title">Race Strategy</h3>
                        <p className="feature-desc">
                            Pit stop timing, tire choices, and race-day analysis
                            tailored to each Grand Prix.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>
                        </div>
                        <h3 className="feature-title">Driver Stats</h3>
                        <p className="feature-desc">
                            Career stats, season standings, head-to-head comparisons,
                            and driver market updates.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </div>
                        <h3 className="feature-title">Predictions</h3>
                        <p className="feature-desc">
                            Race results, qualifying predictions, and championship
                            projections based on current form.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        </div>
                        <h3 className="feature-title">Team News</h3>
                        <p className="feature-desc">
                            Latest on driver lineups, technical developments,
                            and team performance analysis.
                        </p>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <h2 className="cta-title">Ready to dive into Formula 1?</h2>
                <p className="cta-subtitle">
                    Ask anything — from race tactics to historical stats.
                </p>
                <Link href="/chat" className="cta-button">
                    Start Chatting
                </Link>
            </section>

            <footer className="landing-footer">
                <div className="footer-brand">
                    <Link href="/">
                        <Image src={F1GPTlogo} width={120} alt="F1GPT Logo" />
                    </Link>
                </div>
                <div className="footer-links">
                    <Link href="/login" className="footer-link">Log In</Link>
                    <Link href="/signup" className="footer-link">Sign Up</Link>
                    <Link href="/chat" className="footer-link">Chat</Link>
                </div>
            </footer>
        </div>
    );
}