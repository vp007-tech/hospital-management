# Hospital Management System - Backend Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Setup & Installation](#setup--installation)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Security Considerations](#security-considerations)
11. [Troubleshooting](#troubleshooting)

## Project Overview

The Hospital Management System is a comprehensive backend solution built with Node.js, Express, and MongoDB. It provides APIs for managing hospital operations including patient registration, doctor scheduling, appointment booking, medical records, and billing.

### Key Features:
- Role-based access control (Admin, Doctor, Patient)
- JWT authentication
- Appointment scheduling system
- Electronic medical records
- Billing and payment integration
- Email notifications

## System Architecture

```
hospital-management-backend/
├── config/               # Configuration files
│   └── db.js             # Database connection
├── controllers/          # Business logic
├── models/               # MongoDB models
├── middleware/           # Authentication middleware
├── routes/               # API route definitions
├── utils/                # Utility functions
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── package.json          # Project dependencies
└── server.js             # Application entry point
```

## API Endpoints

### Authentication
| Method | Endpoint           | Description                | Access      |
|--------|--------------------|----------------------------|-------------|
| POST   | /api/auth/register | Register new user          | Public      |
| POST   | /api/auth/login    | Login user                 | Public      |
| GET    | /api/auth/me       | Get current user profile   | All roles   |

### Patients
| Method | Endpoint                 | Description                     | Access          |
|--------|--------------------------|---------------------------------|-----------------|
| GET    | /api/patients            | Get all patients                | Admin           |
| GET    | /api/patients/:id        | Get single patient              | Admin, Doctor   |
| PUT    | /api/patients/:id        | Update patient                  | Patient, Admin  |
| DELETE | /api/patients/:id        | Delete patient                  | Admin           |
| GET    | /api/patients/:id/appointments | Get patient appointments | Patient, Doctor, Admin |
| GET    | /api/patients/:id/medical-records | Get medical records | Patient, Doctor, Admin |

### Doctors
| Method | Endpoint                 | Description                     | Access          |
|--------|--------------------------|---------------------------------|-----------------|
| GET    | /api/doctors             | Get all doctors                 | Public          |
| POST   | /api/doctors             | Create doctor profile           | Admin           |
| GET    | /api/doctors/:id         | Get single doctor               | Public          |
| PUT    | /api/doctors/:id         | Update doctor                   | Doctor, Admin   |
| DELETE | /api/doctors/:id         | Delete doctor                   | Admin           |
| GET    | /api/doctors/:id/appointments | Get doctor appointments | Doctor, Admin   |

### Appointments
| Method | Endpoint                     | Description                     | Access          |
|--------|------------------------------|---------------------------------|-----------------|
| GET    | /api/appointments            | Get all appointments            | Admin           |
| POST   | /api/appointments            | Create appointment              | Patient         |
| GET    | /api/appointments/:id        | Get single appointment          | Patient, Doctor, Admin |
| PUT    | /api/appointments/:id/status | Update appointment status       | Doctor, Admin   |
| PUT    | /api/appointments/:id/cancel | Cancel appointment              | Patient         |

### Billing
| Method | Endpoint                     | Description                     | Access          |
|--------|------------------------------|---------------------------------|-----------------|
| GET    | /api/billing                 | Get all bills                   | Admin           |
| GET    | /api/billing/:id             | Get single bill                 | Patient, Doctor, Admin |
| POST   | /api/billing/:id/payment-intent | Create payment intent       | Patient         |
| PUT    | /api/billing/:id/payment     | Update payment status           | Patient, Admin  |
| GET    | /api/billing/patient/:patientId | Get patient bills        | Patient, Admin  |

### Medical Records
| Method | Endpoint                     | Description                     | Access          |
|--------|------------------------------|---------------------------------|-----------------|
| POST   | /api/medical-records         | Create medical record           | Doctor, Admin   |
| GET    | /api/medical-records/:id     | Get medical record              | Patient, Doctor, Admin |
| PUT    | /api/medical-records/:id     | Update medical record           | Doctor, Admin   |
| PUT    | /api/medical-records/:id/files | Add files to medical record  | Doctor, Admin   |

## Authentication

The system uses JWT (JSON Web Tokens) for authentication. After successful login, clients receive a token that must be included in the Authorization header for protected routes.

```
Authorization: Bearer <token>
```

Tokens expire after 30 days (configurable in .env).

## Database Schema

### User
```javascript
{
  name: String,
  email: String,       // unique
  password: String,    // hashed
  role: String,        // enum: ['patient', 'doctor', 'admin']
  contact: String,
  createdAt: Date
}
```

### Doctor
```javascript
{
  user: ObjectId,      // reference to User
  specialization: String,
  qualifications: [String],
  experience: String,
  fees: Number,
  schedule: [{
    day: String,       // enum: days of week
    startTime: String,
    endTime: String
  }],
  status: String       // enum: ['active', 'inactive']
}
```

### Appointment
```javascript
{
  patient: ObjectId,   // reference to User
  doctor: ObjectId,    // reference to Doctor
  date: Date,
  time: String,
  status: String,      // enum: ['pending', 'confirmed', 'cancelled', 'completed']
  symptoms: String,
  diagnosis: String,
  prescription: String,
  notes: String
}
```

### Billing
```javascript
{
  appointment: ObjectId, // reference to Appointment
  patient: ObjectId,     // reference to User
  doctor: ObjectId,      // reference to Doctor
  amount: Number,
  status: String,        // enum: ['pending', 'paid', 'cancelled']
  paymentMethod: String, // enum: ['cash', 'card', 'online']
  paymentDetails: Object,
  paidAt: Date
}
```

### MedicalRecord
```javascript
{
  patient: ObjectId,     // reference to User
  doctor: ObjectId,      // reference to User
  appointment: ObjectId, // reference to Appointment
  diagnosis: String,
  prescription: String,
  tests: String,
  notes: String,
  files: [{
    name: String,
    url: String
  }],
  date: Date
}
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USERNAME=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
STRIPE_SECRET_KEY=your_stripe_test_key
RAZORPAY_KEY_ID=your_razorpay_test_key
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

## Setup & Installation

1. **Prerequisites**:
   - Node.js (v14 or higher)
   - MongoDB (v4 or higher)
   - Git

2. **Installation**:
   ```bash
   git clone https://github.com/yourusername/hospital-management-backend.git
   cd hospital-management-backend
   npm install
   ```

3. **Configuration**:
   - Create `.env` file based on the example above
   - Update MongoDB connection string if needed

4. **Running the application**:
   - Development: `npm run dev` (uses nodemon for auto-restart)
   - Production: `npm start`

5. **Initial Setup**:
   - Create your first admin user by registering through the API
   - Update the user role to 'admin' directly in MongoDB:
     ```javascript
     db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})
     ```

## Testing

While comprehensive tests are not included in this basic setup, you can test the API endpoints using Postman or any API testing tool.

1. **Authentication Test**:
   - Register a new user (POST /api/auth/register)
   - Login with credentials (POST /api/auth/login)
   - Use the returned token to access protected routes

2. **Role Testing**:
   - Test endpoints with different user roles to verify access control

## Deployment

### Local Deployment
1. Install MongoDB locally
2. Run `npm start`
3. Access API at `http://localhost:5000`

### Cloud Deployment (Heroku Example)
1. Create a new Heroku app
2. Add MongoDB Atlas connection string to config vars
3. Push code to Heroku:
   ```bash
   heroku login
   heroku git:remote -a your-app-name
   git push heroku main
   ```

### Docker Deployment
1. Create `Dockerfile`:
   ```dockerfile
   FROM node:14
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```
2. Build and run:
   ```bash
   docker build -t hospital-backend .
   docker run -p 5000:5000 -d hospital-backend
   ```

## Security Considerations

1. **Always**:
   - Keep dependencies updated
   - Use HTTPS in production
   - Store secrets in environment variables (never in code)
   - Implement rate limiting in production

2. **For Production**:
   - Enable CORS only for trusted domains
   - Implement input validation
   - Add request rate limiting
   - Use helmet.js for security headers
   - Regularly backup database

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**:
   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure network access if using cloud DB

2. **Authentication Issues**:
   - Verify JWT secret matches
   - Check token expiration
   - Ensure Authorization header is properly formatted

3. **File Upload Problems**:
   - Check Multer configuration
   - Verify uploads directory permissions
   - Ensure file size limits are appropriate
