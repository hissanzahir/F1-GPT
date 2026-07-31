const Bubble = ({ message }) => {
    const { role, content } = message;

    return (
        <div className={`bubble ${role}`}>
            {content}
        </div>
    );
};

export default Bubble;