const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const CircularJSON = require('circular-json');
const bcrypt = require('bcryptjs');
// MongoDB setup
const JWT_SECREATE='djgyufijhgfjkg789040rjflfl;logdbvvffeekmeknkji4.[opypkjj764kgg[]kk'
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Sammy:7eDEKLgFEPZq5aRR@contactkeeper.a2urz.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));


// Middleware to parse JSON bodies
app.use(express.json());


// post data ////////////////////////
// Define a schema for your data
const postSchema = new mongoose.Schema({
  username: String,
  comment: String,
  image: String,
  videoUri: String,
  status: {
    type: String,
    enum: ['new', 'view'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});



// Define a model based on the schema
const Post = mongoose.model('Post', postSchema);

// Endpoint to handle POST requests from React Native app
app.post('/api/posts', async (req, res) => {
  try {
    const { username, comment, image, videoUri } = req.body;

    // Create a new Post document
    const newPost = new Post({
      username,
      comment,
      image,
      videoUri,
    });

    // Save the new post to the database
    await newPost.save();

    // Send a success response
    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// fetching for the post base on time of post
app.get('/api/posts', async (req, res) => {
  try {
    // Fetch all posts from the database and sort them by descending order of creation date and username
    const posts = await Post.find().sort({ createdAt: -1, username: 1 });

    // Send the fetched posts as the response
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ----------- login/register part -----------------------------------------
// Define a schema for the registration data
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
  },
  phoneNumber: {
    type: String,
    unique: true // if phone numbers should be unique
  },
  // profilePicture: {
  //   type: String,
  // },
  dob: {
    type:  Date,
  },
  sex: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, {
  collection: "ScocLogin"
});


// Create a model based on the schema
const User = mongoose.model('ScocLogin', userSchema);

// Endpoint for registering a user
// Endpoint for registering a user
app.post('/register', async (req, res) => {
  const { userName, email, password, phoneNumber,sex,dob } = req.body;

  // Check if the email or username already exists
  const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  try {
    // Hash the password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create the user
    await User.create({
      userName,
      email,
      password: encryptedPassword,
      phoneNumber,
      sex,
      dob
    });

    res.status(201).json({ status: 'ok', message: 'User Created' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login route
// app.post('/login-user', async (req, res) => {
//   const { userName, password } = req.body;
//   const oldUser= await User.findOne({userName: userName});
//   if(!oldUser) {
//     return res.send({data: 'User do not exist'});
//   }

//   if (await bcrypt.compare(password, oldUser.password)){
//       // Generate JWT
//       const token = jwt.sign({ userName: oldUser.userName }, JWT_SECREATE);
//       if(res.status(201)){
//         return res.send({status: 'ok', data: token})
//       }else{
//         return res.send({ error: 'error'})
//       }
//   }
// });

// Login route
app.post('/login-user', async (req, res) => {
  const { userName, password } = req.body;
  try {
    const oldUser = await User.findOne({ userName: userName });
    if (!oldUser) {
      return res.status(404).json({ error: 'User does not exist' });
    }

    const passwordMatch = await bcrypt.compare(password, oldUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Generate JWT
    const token = jwt.sign({ userName: oldUser.userName }, JWT_SECRET);

    // Fetch the user's image
    const userImage = oldUser.profilePicture;

    // Send response with token and user image
    return res.status(200).json({ status: 'ok', data: { token, userImage } });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Login route
// app.post('/login-user', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Find user by email
//     const user = await User.findOne({ email });

//     if (!user) {
//       // If user not found, return error
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Compare password
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       // If password is incorrect, return error
//       return res.status(401).json({ error: 'Invalid password' });
//     }

//     // Password is valid, navigate to another page
//     // For example, you can redirect to '/dashboard' route
//     res.status(200).json({ status: 'ok', data: 'Login successful' });
//   } catch (error) {
//     // Handle any unexpected errors
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// fetching for all registered user
app.get('/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}, { password: 0 }); // Exclude password field from the response

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// -------------------- STORY POST SECTION =====================

const storySchema = new mongoose.Schema({
  username: String,
  comment: String,
  image: String,
  videoUri: String,
  status: {
    type: String,
    enum: ['new', 'view'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define a model based on the schema
const Story = mongoose.model('StoriesPost', storySchema);

// stories api
app.post('/api/stories-post', async (req, res) => {
  try {
    const { username, comment, image, videoUri } = req.body;

    // Create a new Post document
    const newStory = new Story({
      username,
      comment,
      image,
      videoUri,
    });

    // Save the new Story to the database
    await newStory.save();

    // Send a success response
    res.status(201).json({ message: 'Story Post created successfully' });
  } catch (error) {
    console.error('Error creating Story post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// api for fetching for story post
app.get('/api/stories-post', async (req, res) => {
  try {
    // Fetch all posts from the database and sort them by descending order of creation date and username
    const stories = await Story.find().sort({ createdAt: -1, username: 1 });

    // Send the fetched posts as the response
    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching Story posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// ------------------------------------------------------------------
//api for the live streaming
// Replace 'YOUR_API_KEY' and 'YOUR_API_SECRET' with your actual GetStream.io API key and secret
const apiKey = 'pfbvabh8kmws';
const apiSecret = 'pjg92x6j2gr2qrddg8qb429svv872sqdtgrbyuxpf26k7qhx22ddc32jqu64yccs';

// Endpoint to start a new stream
app.get('/start-stream', async (req, res) => {
  try {
      const response = await axios.post('https://api.getstream.io/api/v1.0/live', {
          api_key: apiKey,
          secret: apiSecret,
          // Additional parameters for stream configuration
      });
      res.json(response.data);
  } catch (error) {
      console.error('Error starting stream:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});









const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
