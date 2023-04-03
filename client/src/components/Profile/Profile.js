import User from "./User";
import UserPosts from "./UserPosts";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classes from './Profile.module.css';
import { useSelector } from "react-redux";
const Profile = () => {
    const authData = useSelector(state => state.auth.authData);
    const {userId} = useParams();
    const [user, setUser] = useState(null);
    useEffect(() => {
        const fetchData = async() => {
            const response = await axios.get('http://localhost:5000/user/'+userId);
            setUser(response.data);
        }
        fetchData();
    }, [userId, authData])
    return (
    <div className={classes.profile}>
        {user && 
        <>
            <User user={user}/>
            <UserPosts posts={user.posts}/>
        </>
        }
    </div>);
}
export default Profile;