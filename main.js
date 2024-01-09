const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;
const uri = 'mongodb+srv://syamaailsolehin:solehin46@syamaail.oiyntni.mongodb.net/CarRental';
const dbName = "CarRental";
const hostCollectionDB = "users";
const rentalDetailCollectionDB = "RentalDetails";
const carDetailsCollectionDB = "CarDetails";


const client = new MongoClient(uri, {
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'TESTSECRET',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true, // Enable this in a production environment with HTTPS
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour (adjust as needed)
  },
}));

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CarRental API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Path to the API documentation
  apis: ['./swagger.js'],
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// Middleware for registration input validation
const registrationValidation = [
  body('username').trim().isAlphanumeric().isLength({ min: 5 }),
  body('password').isLength({ min: 8 }),
  body('name').isString(),
  body('email').isEmail(),
];

const rentalDetailValidation = [
  body('Name').isString(),
  body('phonenumber').isMobilePhone('any', { strictMode: false }),
  body('appointmentDate').isISO8601(),
  body('ICnumber').isString(),
  body('email').isEmail(),
];


// Function to generate a JWT token for an user
function generateToken(user) {
  const payload = {
    username: user.username,
  };

  const token = jwt.sign(
    payload,
    'TESTSECRET', // Replace with your secret key
    { expiresIn: '1h' }
  );

  return token;
}


// Define the route for user registration
app.post('/register-User', registrationValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password, name, email } = req.body;

    // Check if the username already exists in MongoDB
    const existingUser = await client.db(dbName).collection(hostCollectionDB).findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: 'Error! User already registered.' });
    } else {
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a user object
      const user = {
        username,
        password: hashedPassword,
        name,
        email,
      };

      // Insert the user object into MongoDB
      await client.db(dbName).collection(hostCollectionDB).insertOne(user);

      // Set the user data in the session
      req.session.user = { username, name, email };

      res.status(201).json({ message: 'Registration successful!', user });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Login user
app.post('/login-user', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await client.db(dbName).collection(hostCollectionDB).findOne({ username });

    if (!user) {
      return res.status(401).send('Invalid credentials');
    }

    if (!(await bcrypt.compare(password, user.password || ''))) {
      return res.status(401).send('Invalid credentials');
    }

    // Generate a user token
    const userToken = generateToken(user);

    // Set the user token in the session
    req.session.userToken = userToken;

    res.status(200).json({ userToken });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error logging in');
  }
});


// Rent a car
app.post('/rent-car', rentalDetailValidation, async (req, res) => {
  try {
    const { name, phonenumber, rentalDate, ICnumber, email } = req.body;

    // Extract the user token from the request header
    const userToken = req.headers.authorization.split(' ')[1];

    // Verify the user token
    const decodedUser = jwt.verify(userToken, 'TESTSECRET'); // Replace with your secret key

    // Access user data from the decoded token
    const username = decodedUser.username;

    const RentalDetails = {
      username,
      name,
      phonenumber,
      rentalDate,
      ICnumber,
      email,
    };

    await client
      .db(dbName)
      .collection(rentalDetailCollectionDB)
      .insertOne(RentalDetails);

    res.status(201).send('Rent created successfully');
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).send('Error creating appointment');
  }
});

// Delete car rental entry by date for a user
app.delete('/delete-rent-car/:appointmentDate', async (req, res) => {
  try {
    // Extract the user token from the request header
    const userToken = req.headers.authorization.split(' ')[1];

    // Verify the user token
    const decodedUser = jwt.verify(userToken, 'TESTSECRET'); // Replace with your secret key

    // Access user data from the decoded token
    const username = decodedUser.username;

    // Extract the appointment date from the request parameters
    const appointmentDate = req.params.appointmentDate;

    // Delete the car rental entry for the user on the specified date
    const result = await client
      .db(dbName)
      .collection(rentalDetailCollectionDB)
      .deleteOne({ username, appointmentDate });

    if (result.deletedCount === 1) {
      res.status(200).send('Car rental entry deleted successfully');
    } else {
      res.status(404).send('Car rental entry not found');
    }
  } catch (error) {
    console.error('Error deleting car rental entry:', error);
    res.status(500).send('Error deleting car rental entry');
  }
});


// Function to generate a JWT token for an admin
function generateTokenAdmin() {
  const payload = {
    username: 'admin',
  };

  const token = jwt.sign(
    payload,
    'abc', // Replace with your admin secret key
    { expiresIn: '1h' }
  );

  return token;
}

app.post('/login-admin', async (req, res) => {
  try {
    const { privateKey } = req.body;

    // Check if the provided private key is valid (In a real-world scenario, this should be more secure)
    if (privateKey === '123') {
      // Generate a token for the admin
      const adminToken = generateTokenAdmin();

      // Store the admin token in the session
      req.session.adminToken = adminToken;

      // Send the admin token in the response
      res.status(200).json({ adminToken, message: 'Admin login successful' });
    } else {
      res.status(401).send('Unauthorized');
    }
  } catch (error) {
    console.error('Error logging in as admin:', error);
    res.status(500).send('Error logging in as admin');
  }
});


// Middleware to verify admin token
async function verifyAdminToken(req, res, next) {
  try {
    const adminToken = req.headers.authorization;

    if (!adminToken) {
      console.error('No admin token provided');
      return res.status(401).send('Unauthorized');
    }

    const decodedAdmin = jwt.verify(adminToken.split(' ')[1], 'abc');

    if (decodedAdmin.username !== 'admin') {
      console.error('User is not an admin');
      return res.status(403).send('Forbidden');
    }

    req.admin = decodedAdmin;
    next();
  } catch (error) {
    console.error('Admin token verification error:', error);
    return res.status(403).send('Forbidden');
  }
}


// Admin edit data user
app.patch('/admin-update-rental/:username', verifyAdminToken, async (req, res) => {
  try {
    const { name, email, phonenumber, appointmentDate, ICnumber } = req.body;
    const { username } = req.params;

    const updateFields = {};

    // Check if each field is provided and update only those fields
    if (name) {
      updateFields.name = name;
    }
    if (email) {
      updateFields.email = email;
    }
    if (phonenumber) {
      updateFields.phonenumber = phonenumber;
    }
    if (appointmentDate) {
      updateFields.appointmentDate = appointmentDate;
    }
    if (ICnumber) {
      updateFields.ICnumber = ICnumber;
    }

    // Update the user data in MongoDB
    await client
      .db(dbName)
      .collection(rentalDetailCollectionDB)
      .updateOne({ username }, { $set: updateFields });

    res.status(200).send('User data updated successfully by admin');
  } catch (error) {
    console.error('Error updating user data by admin:', error);
    res.status(500).send('Error updating user data by admin');
  }
});


// Admin view all data
app.get('/admin-view-data', verifyAdminToken, async (req, res) => {
  try {
    const usersData = await client
      .db(dbName)
      .collection(hostCollectionDB)
      .find()
      .toArray();

    const RentalDetailsData = await client
      .db(dbName)
      .collection(rentalDetailCollectionDB)
      .find()
      .toArray();

    const CarDetailsData = await client
      .db(dbName)
      .collection(carDetailsCollectionDB)
      .find({})
      .toArray();

    res.status(200).json({ users: usersData, RentalDetails: RentalDetailsData, CarDetails: CarDetailsData });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).send('Error fetching admin data');
  }
});


// Admin Create Car Details
app.post('/admin-create-car', verifyAdminToken, async (req, res) => {
  try {
    const { brand, model, year, colour, noplate } = req.body;

    // Extract the admin token from the request header
    const adminToken = req.headers.authorization.split(' ')[1];

    // Verify the admin token
    const decodedAdmin = jwt.verify(adminToken, 'abc'); // Replace with your secret key

    // Access admin data from the decoded token
    const adminUsername = decodedAdmin.username;

    const carDetails = {
      username: adminUsername, // Associate the car details with the admin user
      brand,
      model,
      year,
      colour,
      noplate,
    };

    await client
      .db(dbName)
      .collection(carDetailsCollectionDB)
      .insertOne(carDetails);

    res.status(201).send('Car details created successfully by admin');
  } catch (error) {
    console.error('Error creating car details by admin:', error);
    res.status(500).send('Error creating car details by admin');
  }
});


// Admin Update Car Details
app.patch('/admin-update-car/:carId', verifyAdminToken, async (req, res) => {
  try {
    const { brand, model, year, colour, noplate } = req.body;
    const { carId } = req.params;

    const updateFields = {};

    // Check if each field is provided and update only those fields
    if (brand) {
      updateFields.brand = brand;
    }
    if (model) {
      updateFields.model = model;
    }
    if (year) {
      updateFields.year = year;
    }
    if (colour) {
      updateFields.colour = colour;
    }
    if (noplate) {
      updateFields.noplate = noplate;
    }

    // Update the car details in MongoDB
    await client
    .db(dbName)
    .collection(carDetailsCollectionDB)
    .updateOne({ _id: new ObjectId(carId) }, { $set: updateFields });

    res.status(200).send('Car details updated successfully by admin');
  } catch (error) {
    console.error('Error updating car details by admin:', error);
    res.status(500).send('Error updating car details by admin');
  }
});

// Admin Delete Car by ID
app.delete('/admin-delete-car/:carId', verifyAdminToken, async (req, res) => {
  try {
    // Extract the admin token from the request header
    const adminToken = req.headers.authorization.split(' ')[1];

    // Verify the admin token
    const decodedAdmin = jwt.verify(adminToken, 'abc'); // Replace with your secret key

    // Access admin data from the decoded token
    const adminUsername = decodedAdmin.username;

    // Extract the car ID from the request parameters
    const carId = req.params.carId;

    // Delete the car entry by ID for the admin
    const result = await client
      .db(dbName)
      .collection(carDetailsCollectionDB)
      .deleteOne({ _id: new ObjectId(carId), username: adminUsername });

    if (result.deletedCount === 1) {
      res.status(200).send('Car entry deleted successfully by admin');
    } else {
      res.status(404).send('Car entry not found');
    }
  } catch (error) {
    console.error('Error deleting car entry by admin:', error);
    res.status(500).send('Error deleting car entry by admin');
  }
});



// Connect to MongoDB and start the server
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log('Server is running on port ${port}');
  });
});