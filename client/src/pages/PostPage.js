import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Post from "../components/posts/Post";
import Container from "../components/UI/Container";
import classes from './PostPage.module.css';
const PostPage = () => {
    const {postId} = useParams();
    const posts = useSelector(state => state.posts);
    const [post, setPost] = useState(null);
    // useEffect(()=>{
    //     const fetchData = async() => {
    //         const response = await axios.get('http://localhost:5000/posts/post/'+postId);
    //         setPost(response.data);
    //     }
    //     fetchData();
    // }, [postId]);
    useEffect(()=>{
        const temp = posts.find(post => post._id === postId);
        if(temp) setPost(temp);
    },[postId, posts])
    return (
        <Container >
            <div className={classes.singlePost}>
                {post && <Post post={post}/>}
            </div>
        </Container>
    )
};
export default PostPage;