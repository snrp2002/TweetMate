import { useSelector } from "react-redux";
import Auth from "../components/Auth/Auth";
import Container from "../components/UI/Container";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
const AuthPage = () => {
    const navigate = useNavigate();
    const authData = useSelector((state) => state.auth.authData);
    useEffect(()=>{
        if(authData)
            navigate("/");
    }, [authData, navigate])
    return (
        <Container>
            <Auth/>
        </Container>
    )
};
export default AuthPage;