const GlobalError = ({ statusCode }) => {
    return (
        <div>
            <h1 style={{ color: "red" }}>
                {statusCode
                    ? `Error ${statusCode}`
                    : "An unexpected error has occurred"}
            </h1>
            <p>Sorry, something went wrong. Please try again later.</p>
            <p>Global Error Page</p>
        </div>
    );
};

export default GlobalError;