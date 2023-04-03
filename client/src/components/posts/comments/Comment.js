import classes from './Comment.module.css';
import profileImage from '../../../images/profile.png';
import moment from "moment";
import {useNavigate} from 'react-router-dom'
const Comment = (props) => {
    const navigate = useNavigate();
    const showProfileHandler = () => {
        navigate(`/user/${props.comment.user}`);
    }
    return (
        <div className={classes.commentContainer}>
            <img src={props.comment.image || profileImage} alt='dp' onClick={showProfileHandler}/>
            <div className={classes.comment}>
                <div className={classes.name} onClick={showProfileHandler}>{props.comment.name}</div>
                <div className={classes.message}>{props.comment.comment}</div>
                <div className={classes.time}>
                    {moment(props.comment.createdAt).fromNow()}
                </div>
            </div>
        </div>
    )
}
export default Comment;