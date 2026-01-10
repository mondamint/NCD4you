# NCDs 4YOU - Non-Communicable Diseases Management System

A comprehensive web application for managing NCD (Non-Communicable Diseases) patient care in healthcare facilities, with role-based access for hospitals and health centers.

## Features

- **Patient Management**: Register, track, and manage patient records
- **Appointment Scheduling**: Schedule and track patient appointments with vital signs monitoring
- **Role-Based Access Control**: Separate interfaces for Admin, Hospital, and Health Center staff
- **Zone-Based Patient Assignment**: Automatic assignment of patients to health centers based on location
- **Home OPD Tracking**: Track home-based outpatient department visits
- **Excel Import/Export**: Bulk import patient data from Excel files
- **Vital Signs Monitoring**: Record blood pressure and blood sugar readings
- **Referral System**: Send patients to health centers and receive referrals back

## Tech Stack

### Frontend
- React 19 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Day.js for date handling
- XLSX for Excel operations

### Backend
- FastAPI (Python web framework)
- SQLAlchemy ORM
- PostgreSQL (Supabase) for production
- SQLite for local development
- JWT authentication
- Bcrypt password hashing

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase (PostgreSQL)
- **Source Control**: GitHub

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/ncds-4you.git
   cd ncds-4you
   ```

2. **Set up Backend**
   ```bash
   cd backend
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Mac/Linux
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment**
   - Copy `.env.example` to `.env` in the root directory
   - Update with your local settings (optional for local development)

5. **Run the Application**

   Option A - Use the launcher script:
   ```bash
   python run_app.py
   ```

   Option B - Run separately:

   Terminal 1 (Backend):
   ```bash
   cd backend
   venv\Scripts\activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the default password immediately after first login!

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to:
- Supabase (Database)
- Railway (Backend)
- Vercel (Frontend)

## Project Structure

```
ncds-4you/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── models.py            # SQLAlchemy database models
│   ├── database.py          # Database configuration
│   ├── user_auth.py         # JWT authentication
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── config.js                # Frontend API configuration
├── supabase_migration.sql   # Database schema
├── Procfile                 # Railway deployment
├── vercel.json              # Vercel configuration
├── DEPLOYMENT_GUIDE.md      # Deployment instructions
└── README.md                # This file
```

## User Roles

1. **Admin**
   - Full access to all features
   - User management
   - System-wide patient and appointment management

2. **Hospital**
   - Create and manage patients
   - Schedule appointments
   - Send patients to health centers
   - View all data

3. **Health Center (HC)**
   - View patients in assigned zone
   - Record vital signs for appointments
   - Refer patients back to hospital
   - Manage home OPD records

## Database Schema

### Users
- Authentication and role management
- Location-based access control

### Patients
- Patient demographics
- Medical information
- Zone assignment

### Appointments
- Scheduled visits
- Vital signs records (BP, blood sugar)
- Status tracking (pending, completed, referred_back)

### Home OPD
- Home-based care records
- Patient or OSM (Other Service Member) types

## API Documentation

When running locally, visit http://localhost:8001/docs for interactive API documentation powered by FastAPI's built-in Swagger UI.

## Security Features

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control
- CORS protection
- Environment variable configuration
- Secure session management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team.

## Acknowledgments

- Built with FastAPI and React
- Deployed on Railway, Vercel, and Supabase
- Designed for healthcare facilities in Thailand

---

**Made with ❤️ for better NCD patient care**
