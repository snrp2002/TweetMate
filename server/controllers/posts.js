import Comments from "../models/comments.js";
import Post from "../models/posts.js";
import User from "../models/user.js";

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().lean();
    const updatedPosts = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findOne({ _id: post.creator }).lean();
        return { userName: user.name, userImage: user.image, ...post};
      })
    );
    res.status(200).json(updatedPosts);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await Post.findOne({ _id: id }).lean();
    const user = await User.findOne({ _id: post.creator }).lean();
    res
      .status(200)
      .json({ ...post, userName: user.name, userImage: user.image });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  const post = req.body;
  const newPost = new Post({
    ...post,
    creator: req.userId,
    createdAt: new Date().toISOString(),
  });
  try {
    const savedPost = (await newPost.save()).toObject();
    const user = await User.findOne({ _id: req.userId }).lean();
    const comments = new Comments({
      postId: savedPost._id
    });
    await comments.save();
    user.posts = [savedPost._id, ...user.posts];
    await User.findOneAndUpdate({ _id: req.userId }, user, { new: true });
    res.status(201).json({...savedPost, userName: user.name, userImage: user.image});
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    await Post.deleteOne({ _id: postId });
    await Comments.deleteOne({postId: postId});
    const user = await User.findOne({ _id: req.userId });
    user.posts = user.posts.filter((id) => id !== postId);
    await User.findByIdAndUpdate(req.userId, user, { new: true });
    res.json({ message: "Successfully deleted the post." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editPost = async (req, res) => {
  const post = req.body;
  const user = {userName: post.userName, userImage: post.userImage};
  try {
    const editedPost = await Post.findByIdAndUpdate(post._id, post, {
      new: true,
    }).lean();
    res.json({...editedPost, ...user});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const likePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId);
    const index = await post.likes.findIndex((id) => id === String(req.userId));
    if (index === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes = post.likes.filter((id) => id !== String(req.userId));
    }
    const updatedPost = await Post.findByIdAndUpdate(postId, post, {
      new: true,
    }).lean();
    const user = await User.findOne({ _id: updatedPost.creator }).lean();
    res.status(200).json({...updatedPost, userName: user.name, userImage: user.image});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
