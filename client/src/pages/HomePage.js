import Container from '../components/UI/Container';
import NewPost from '../components/posts/newPost/NewPost';
import Posts from '../components/posts/Posts';
const HomePage = () => {
    return (
        <Container>
            <NewPost id="newPost"/>
            <Posts id="posts"/>
        </Container>
    )
};
export default HomePage;