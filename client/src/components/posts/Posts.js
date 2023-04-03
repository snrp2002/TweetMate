import classes from './Posts.module.css';
import Post from './Post';
import Loader from '../UI/Loader';
import { useSelector} from 'react-redux';
const Posts = () => {
    const posts = useSelector(state => state.posts);
    return (
        <div className={classes.posts}>
            {posts.length === 0 && <Loader/>}
            {posts.map(post => <Post key={post._id} post={post}/>)}
        </div>
    )
}
export default Posts;