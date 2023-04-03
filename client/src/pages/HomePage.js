import Container from "../components/UI/Container";
import NewPost from "../components/posts/newPost/NewPost";
import Posts from "../components/posts/Posts";
import { useLocation, useNavigate } from "react-router-dom";
import { Notification } from "../components/UI/Popups";
import { useSelector } from "react-redux";
import Loader from "../components/UI/Loader";
const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const posts = useSelector(state => state.posts);
  if (location.state) {
    Notification.fire({
      icon:"success",
      text: location.state.message,
    }).then(() => {
      navigate({ state: null });
    });
  }
  return (
    <Container>
      {posts.length === 0 && <Loader/>}
      {posts.length !==0 &&
      <>
        <NewPost id="newPost" />
        <Posts id="posts" />
      </>}
    </Container>
  );
};
export default HomePage;
