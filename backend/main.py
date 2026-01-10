from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta, datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
import pandas as pd
import io
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from . import models, database
from .user_auth import create_access_token, get_current_user, authenticate_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES, Token

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Get CORS origins from environment variable, default to "*" for local development
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
cors_origins = cors_origins_str.split(",") if cors_origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class UserBase(BaseModel):
    username: str
    role: str
    location_name: Optional[str] = None

class UserCreateData(BaseModel):
    username: str
    password: str
    name: str 
    position: str
    role: str
    location_name: Optional[str] = None

class UserUpdateData(BaseModel):
    password: Optional[str] = None
    name: Optional[str] = None
    position: Optional[str] = None
    role: Optional[str] = None
    location_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    name: Optional[str] = None
    position: Optional[str] = None
    plain_password: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class PatientCreate(BaseModel):
    hn: str
    name: str
    cid: str
    phone: Optional[str] = None
    medical_rights: Optional[str] = None
    clinic: Optional[str] = None
    house_no: Optional[str] = None
    moo: Optional[str] = None
    tumbol: Optional[str] = None
    amphoe: Optional[str] = None
    province: Optional[str] = None
    hc_zone: Optional[str] = None

class PatientResponse(PatientCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AppointmentCreate(BaseModel):
    patient_id: int
    appointment_date: str # YYYY-MM-DD
    note: Optional[str] = None
    req_bp: bool = False
    req_bs: bool = False

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    appointment_date: date
    note: Optional[str]
    status: str
    bp_sys: Optional[int]
    bp_dia: Optional[int]
    bp_sys_2: Optional[int]
    bp_dia_2: Optional[int]
    blood_sugar: Optional[int]
    refer_back_note: Optional[str]
    patient: PatientResponse
    req_bp: bool = False
    req_bs: bool = False

    model_config = ConfigDict(from_attributes=True)

class VisitUpdate(BaseModel):
    bp_sys: Optional[int] = None
    bp_dia: Optional[int] = None
    bp_sys_2: Optional[int] = None
    bp_dia_2: Optional[int] = None
    blood_sugar: Optional[int] = None

class ReferBack(BaseModel):
    note: str

class HomeOPDCreate(BaseModel):
    patient_id: Optional[int] = None
    cid: Optional[str] = None
    name: Optional[str] = None
    type: str # patient, osm
    note: Optional[str] = None
    source: Optional[str] = None # Optional from frontend, can be inferred

class HomeOPDResponse(HomeOPDCreate):
    id: int
    created_at: Optional[str]
    source: str
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

# --- Dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Auth Endpoints ---
@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    from .user_auth import verify_password
    if not verify_password(request.password, user.password_hash):
         raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "loc": user.location_name or ""},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"username": user.username, "role": user.role, "location": user.location_name}}

@app.get("/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role, "location": current_user.location_name, "name": current_user.name, "position": current_user.position}

# --- User Management Endpoints (Admin) ---
@app.get("/users", response_model=List[UserResponse])
def get_all_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    return db.query(models.User).all()

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreateData, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_pw,
        plain_password=user.password,
        role=user.role,
        location_name=user.location_name,
        name=user.name,
        position=user.position
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/users/{id}", response_model=UserResponse)
def update_user_endpoint(id: int, user: UserUpdateData, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    db_user = db.query(models.User).filter(models.User.id == id).first()
    if not db_user:
         raise HTTPException(status_code=404, detail="User not found")

    if user.name is not None: db_user.name = user.name
    if user.position is not None: db_user.position = user.position
    if user.role is not None: db_user.role = user.role
    if user.location_name is not None: db_user.location_name = user.location_name
    if user.password:
        db_user.password_hash = get_password_hash(user.password)
        db_user.plain_password = user.password

    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{id}")
def delete_user_endpoint(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    db_user = db.query(models.User).filter(models.User.id == id).first()
    if not db_user:
         raise HTTPException(status_code=404, detail="User not found")
         
    if db_user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")
         
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

# --- Patient Endpoints ---
@app.get("/patients", response_model=List[PatientResponse])
def get_patients(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in ['hospital', 'admin']:
        return db.query(models.Patient).all()
    else:
        # HC can only see their zone
        return db.query(models.Patient).filter(models.Patient.hc_zone == current_user.location_name).all()

@app.post("/patients", response_model=PatientResponse)
def create_patient(patient: PatientCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin', 'hc']:
        raise HTTPException(status_code=403, detail="Only hospital/admin/hc can create patients")
    
    # If HC, force their zone
    if current_user.role == 'hc':
        if patient.hc_zone != current_user.location_name:
            # Option A: Reject
            # raise HTTPException(status_code=400, detail="Cannot create patient outside your zone")
            # Option B: Force overwrite
            patient.hc_zone = current_user.location_name
    
    # Check existing HN
    existing = db.query(models.Patient).filter(models.Patient.hn == patient.hn).first()
    if existing:
        raise HTTPException(status_code=400, detail="HN already exists")

    # Check existing CID
    existing_cid = db.query(models.Patient).filter(models.Patient.cid == patient.cid).first()
    if existing_cid:
        raise HTTPException(status_code=400, detail="CID already exists")

    new_patient = models.Patient(
        hn=patient.hn,
        name=patient.name,
        cid=patient.cid,
        phone=patient.phone,
        medical_rights=patient.medical_rights,
        clinic=patient.clinic,
        house_no=patient.house_no,
        moo=patient.moo,
        tumbol=patient.tumbol,
        amphoe=patient.amphoe,
        province=patient.province,
        hc_zone=patient.hc_zone
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@app.delete("/patients/{id}")
def delete_patient(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    db.delete(patient)
    db.commit()
    return {"message": "Deleted successfully"}

@app.put("/patients/{id}")
def update_patient(id: int, patient: PatientCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    db_patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check HN uniqueness if changed
    if patient.hn != db_patient.hn:
        exists = db.query(models.Patient).filter(models.Patient.hn == patient.hn).first()
        if exists:
            raise HTTPException(status_code=400, detail="HN already exists")
            
    # Update fields
    db_patient.hn = patient.hn
    db_patient.name = patient.name
    db_patient.cid = patient.cid
    db_patient.phone = patient.phone
    db_patient.medical_rights = patient.medical_rights
    db_patient.clinic = patient.clinic
    db_patient.house_no = patient.house_no
    db_patient.moo = patient.moo
    db_patient.tumbol = patient.tumbol
    db_patient.amphoe = patient.amphoe
    db_patient.province = patient.province
    db_patient.hc_zone = patient.hc_zone
    
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_hc_zone(tumbol, moo):
    t = str(tumbol).strip()
    m = str(moo).strip().split('.')[0] # Handle float strings like "1.0"
    
    if t == 'ปวนพุ':
        if m in ['6', '7', '9', '12', '15']:
            return 'รพ.สต.บ้านหนองหมากแก้ว'
        else:
             return 'รพ.สต.บ้านปวนพุ'
    
    elif t == 'หนองหิน':
        if m == '2':
            return 'รพ.หนองหิน'
        elif m in ['8', '9', '10', '11', '12', '14']:
             return 'รพ.สต.หลักร้อยหกสิบ'
        else:
             return 'สถานีอนามัยเฉลิมพระเกียรติ'
             
    elif t == 'ตาดข่า':
        return 'รพ.สต.บ้านน้อยสามัคคี'
        
    else:
        return 'รพ.หนองหิน'

@app.post("/patients/upload")
async def upload_patients(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin']:
        raise HTTPException(status_code=403, detail="Only hospital/admin can upload")
    
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except:
        raise HTTPException(status_code=400, detail="Invalid Excel file")

    count = 0
    try:
        # Helper to find value from multiple possible column names
        def get_val(row, keys):
            for k in keys:
                if k in row and not pd.isna(row[k]):
                    return str(row[k]).strip()
            return ""

        processed_hns = set()
        processed_cids = set()

        for _, row in df.iterrows():
            # HN
            hn = get_val(row, ['HN', 'hn', 'Hn'])
            if not hn:
                continue
            if hn in processed_hns or db.query(models.Patient).filter(models.Patient.hn == hn).first():
                continue
            
            # CID
            cid = get_val(row, ['CID', 'cid', 'เลขบัตรประชาชน', 'เลขบัตร'])
            if not cid:
                continue
            if cid in processed_cids or db.query(models.Patient).filter(models.Patient.cid == cid).first():
                continue
            
            # Mark as processed to handle duplicates within the same file
            processed_hns.add(hn)
            processed_cids.add(cid)
            
            # Determine Zone
            zone = get_val(row, ['Zone', 'zone', 'เขตพื้นที่', 'รพ.สต.'])
            if not zone or zone.lower() == 'nan':
                 tumbol = get_val(row, ['Tumbol', 'tumbol', 'ตำบล'])
                 moo = get_val(row, ['Moo', 'moo', 'หมู่'])
                 zone = get_hc_zone(tumbol, moo)

            p = models.Patient(
                hn=hn,
                name=get_val(row, ['Name', 'name', 'ชื่อ', 'ชื่อ-นามสกุล', 'ชื่อ - นามสกุล', 'ชื่อสกุล']),
                cid=cid,
                phone=get_val(row, ['Phone', 'phone', 'เบอร์โทร', 'เบอร์โทรศัพท์']),
                medical_rights=get_val(row, ['Rights', 'rights', 'สิทธิ', 'สิทธิการรักษา']),
                clinic=get_val(row, ['Clinic', 'clinic', 'คลินิก', 'รหัสคลินิก']),
                house_no=get_val(row, ['HouseNo', 'house_no', 'บ้านเลขที่']),
                moo=get_val(row, ['Moo', 'moo', 'หมู่']),
                tumbol=get_val(row, ['Tumbol', 'tumbol', 'ตำบล']),
                amphoe=get_val(row, ['Amphoe', 'amphoe', 'อำเภอ']),
                province=get_val(row, ['Province', 'province', 'จังหวัด']),
                hc_zone=zone
            )
            db.add(p)
            count += 1
        
        db.commit()
        return {"message": f"Uploaded {count} patients"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Appointment Endpoints ---
@app.post("/appointments", response_model=AppointmentResponse)
def create_appointment(appt: AppointmentCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin']:
        raise HTTPException(status_code=403, detail="Only hospital/admin can create appointments")

    # Parse date
    try:
        date_obj = datetime.strptime(appt.appointment_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format YYYY-MM-DD")

    new_appt = models.Appointment(
        patient_id=appt.patient_id,
        appointment_date=date_obj,
        note=appt.note,
        status="pending",
        req_bp=appt.req_bp,
        req_bs=appt.req_bs
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    # Re-query with joinedload to get patient data
    result = db.query(models.Appointment).options(joinedload(models.Appointment.patient)).filter(models.Appointment.id == new_appt.id).first()
    return result

@app.get("/appointments", response_model=List[AppointmentResponse])
def get_appointments(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use joinedload to eager load the patient relationship
    query = db.query(models.Appointment).options(joinedload(models.Appointment.patient)).join(models.Patient)

    if start_date:
        query = query.filter(models.Appointment.appointment_date >= start_date)
    if end_date:
        query = query.filter(models.Appointment.appointment_date <= end_date)

    if current_user.role == 'hc':
        # Filter patients in HC zone
        query = query.filter(models.Patient.hc_zone == current_user.location_name)

    return query.all()

@app.delete("/appointments/{id}")
def delete_appointment(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    appt = db.query(models.Appointment).filter(models.Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # Safety Check: If already completed, warn or block?
    # User requirement: "สามารถแก้ไข... หรือ ลบ เพื่อไม่ส่งตัวได้"
    # Assuming if already completed, should probably not delete?
    # But let's allow it for now per request, maybe frontend warns.
    # Ideally block if status == 'completed' to prevent oprhaned data? 
    # Let's block if completed for safety.
    if appt.status == 'completed':
        raise HTTPException(status_code=400, detail="Cannot delete completed appointment")

    db.delete(appt)
    db.commit()
    return {"message": "Deleted successfully"}

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    note: Optional[str] = None

@app.put("/appointments/{id}")
def update_appointment(id: int, item: AppointmentUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ['hospital', 'admin']:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Use joinedload to eager load the patient relationship
    appt = db.query(models.Appointment).options(joinedload(models.Appointment.patient)).filter(models.Appointment.id == id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.status == 'completed':
        raise HTTPException(status_code=400, detail="Cannot edit completed appointment")

    if item.appointment_date:
        try:
            date_obj = datetime.strptime(item.appointment_date, "%Y-%m-%d").date()
            appt.appointment_date = date_obj
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

    if item.note is not None:
        appt.note = item.note

    db.commit()
    db.refresh(appt)
    return appt

@app.put("/appointments/{id}/visit")
def update_visit(id: int, visit: VisitUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"DEBUG: update_visit called for id {id} with data {visit}")
    try:
        # Use joinedload to eager load the patient relationship
        appt = db.query(models.Appointment).options(joinedload(models.Appointment.patient)).filter(models.Appointment.id == id).first()
        if not appt:
            print("DEBUG: Appointment not found")
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Check permissions (HC own zone)
        if current_user.role == 'hc':
            if appt.patient.hc_zone != current_user.location_name:
                 print(f"DEBUG: Zone mismatch. Appt zone: {appt.patient.hc_zone}, User loc: {current_user.location_name}")
                 raise HTTPException(status_code=403, detail="Not in your zone")

        appt.bp_sys = visit.bp_sys
        appt.bp_dia = visit.bp_dia
        appt.bp_sys_2 = visit.bp_sys_2
        appt.bp_dia_2 = visit.bp_dia_2
        appt.blood_sugar = visit.blood_sugar
        appt.status = "completed"

        db.commit()
        db.refresh(appt)
        print("DEBUG: update_visit success")
        return appt
    except Exception as e:
        print(f"DEBUG: update_visit ERROR: {e}")
        raise e

@app.put("/appointments/{id}/refer-back")
def refer_back(id: int, ref: ReferBack, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"DEBUG: refer_back called for id {id} with data {ref}")
    try:
        # Use joinedload to eager load the patient relationship
        appt = db.query(models.Appointment).options(joinedload(models.Appointment.patient)).filter(models.Appointment.id == id).first()
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        if current_user.role == 'hc':
            if appt.patient.hc_zone != current_user.location_name:
                 raise HTTPException(status_code=403, detail="Not in your zone")

        appt.refer_back_note = ref.note
        appt.status = "referred_back"
        db.commit()
        db.refresh(appt)
        print("DEBUG: refer_back success")
        return appt
    except Exception as e:
        print(f"DEBUG: refer_back ERROR: {e}")
        raise e

# --- Home OPD Endpoints ---
@app.post("/home-opd", response_model=HomeOPDResponse)
def create_home_opd(item: HomeOPDCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = "hospital" if current_user.role in ['hospital', 'admin'] else "hc"
    
    # Simple validation: Must have CID or Patient ID
    if not item.cid and not item.patient_id:
        raise HTTPException(status_code=400, detail="CID or Patient ID required")

    new_item = models.HomeOPD(
        patient_id=item.patient_id,
        cid=item.cid,
        name=item.name,
        type=item.type,
        note=item.note,
        source=source,
        location=current_user.location_name, # Save creator's location
        created_at=str(date.today())
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.get("/home-opd", response_model=List[HomeOPDResponse])
def get_home_opd(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.HomeOPD)
    
    if current_user.role == 'hc':
        # Filter by zone (location) OR joined patient zone
        # Since we save location now, we can trust it for manual entries too if created by HC.
        # But for entries created by Hospital FOR this HC? Hospital might not set location?
        # Let's rely on Patient zone if linked, otherwise location column.
        
        # Simple Logic: filtered by location match or patient.hc_zone match
        # SQLAlchemy OR:
        # filter(or_(models.HomeOPD.location == current_user.location_name, models.HomeOPD.patient.has(hc_zone=current_user.location_name)))
        
        # For simplicity, if we ensure Hospital sets location if known, or we just rely on what we have.
        # If Hospital creates it, they might leave location null? 
        # Requirement: "ค้นหาคนไข้จาก HN แล้วแสดงข้อมูลคนไข้ในเขตพื้นที่ตนเอง" -> This implies linking to patient.
        # If manual CID, maybe Hospital intends it for specific zone? 
        # Let's just filter by matching location if set, or patient zone.
        
        zones = [current_user.location_name]
        query = query.join(models.Patient, isouter=True).filter(
            (models.HomeOPD.location == current_user.location_name) | 
            (models.Patient.hc_zone == current_user.location_name)
        )
        
    return query.all()

# --- Static Files / SPA Serving ---
# Serve specific static folders if they exist (e.g. assets)
# We need to determine the path to frontend/dist. 
# When frozen with PyInstaller, we might be in a temp dir.
# But we are planning to put 'frontend/dist' alongside or inside.

if getattr(sys, 'frozen', False):
    # If run as exe, look in _MEIPASS or adjacent folder
    # We will configure PyInstaller to put 'frontend/dist' into 'static' folder in temp, OR we just trust relative path?
    # Let's assume we bundle 'frontend/dist' into a folder named 'static_ui' inside the exe temp dir.
    base_path = sys._MEIPASS
    static_dir = os.path.join(base_path, "static_ui")
else:
    # Development mode: assume frontend/dist is at ../frontend/dist realtive to backend/main.py
    # backend/main.py is in backend/
    # so ../frontend/dist
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_path, "frontend", "dist")

    static_dir = os.path.join(base_path, "frontend", "dist")

# [NEW] prioritized config.js route
@app.get("/config.js")
async def serve_config():
    # 1. Try external config (next to exe or in root)
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        external_config = os.path.join(exe_dir, "config.js")
    else:
        # Dev: project root (parent of backend)
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        external_config = os.path.join(root_dir, "config.js")
    
    if os.path.exists(external_config):
        print(f"Serving external config from: {external_config}")
        return FileResponse(external_config)
    
    # 2. Fallback to bundled config
    bundled = os.path.join(static_dir, "config.js")
    if os.path.exists(bundled):
        return FileResponse(bundled)
    
    return HTMLResponse("window.globalConfig = {};", status_code=200)

if os.path.exists(static_dir):
    print(f"Serving static files from: {static_dir}")
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    # Catch-all for SPA
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Check if file exists in root of dist (e.g. favicon.ico, logo.png)
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
             return FileResponse(file_path)
             
        # Otherwise return index.html for React Router
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    print(f"WARNING: Static directory not found at {static_dir}")


