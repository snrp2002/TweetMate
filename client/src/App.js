import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import './App.css';
import RootLayout from './pages/RootLayout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import PostPage from './pages/PostPage';
import UserPage from './pages/UserPage';
import { useDispatch } from 'react-redux';
import { getPosts } from './actions/posts';
import { useEffect } from 'react';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/NotFound';
const App = () => {
    const dispatch = useDispatch();
    useEffect(()=>{
        dispatch(getPosts());
    },[dispatch]);
    const router = createBrowserRouter([
        {
            path: '/', 
            element: <RootLayout/>,
            errorElement: <ErrorPage/>,
            children: [
                {index: true, element: <HomePage />},
                {path: 'auth', element: <AuthPage />},
                {path: 'post/:postId', element: <PostPage/>},
                {path: 'user/:userId', element: <UserPage/>},
            ]
        },
        {
            path: '*',
            element: <NotFound/>
        }
    ]);
    return(<RouterProvider router={router}/>);
};
export default App;

