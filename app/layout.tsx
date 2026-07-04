import "./global.css";

export const metadata = {
  title: "F1GPT",
  description: "The ultimate F1 AI assistant, providing real-time insights, analysis, and predictions for Formula 1 enthusiasts.",
};

const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <body> {children} </body>
        </html>
    )
}

export default RootLayout;