import { useRouteError } from "react-router-dom"

const ErrorPage = () => {
    const errorData = useRouteError();
    return (
        <div>
            <h1>ErrorPage</h1>
            {errorData}
        </div>
    )
}
export default ErrorPage;