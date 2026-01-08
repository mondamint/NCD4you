from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    plain_password = Column(String, nullable=True)
    role = Column(String)  # 'admin', 'hospital', 'hc'
    location_name = Column(String) # For HCs, this is their zone name
    name = Column(String) # Name-Surname
    position = Column(String) # Job Position

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    hn = Column(String, unique=True, index=True)
    name = Column(String)
    cid = Column(String, unique=True, index=True) # 13 digit
    phone = Column(String)
    medical_rights = Column(String)
    clinic = Column(String)
    
    # Address
    house_no = Column(String)
    moo = Column(String)
    tumbol = Column(String)
    amphoe = Column(String)
    province = Column(String)

    color = Column(String, nullable=True) # Green, Yellow, Red
    created_at = Column(Date, nullable=True)

    hc_zone = Column(String) # Matches user.location_name
    
    appointments = relationship("Appointment", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    appointment_date = Column(Date)
    
    # HC Results - Round 1
    bp_sys = Column(Integer, nullable=True)
    bp_dia = Column(Integer, nullable=True)
    # HC Results - Round 2
    bp_sys_2 = Column(Integer, nullable=True)
    bp_dia_2 = Column(Integer, nullable=True)
    blood_sugar = Column(Integer, nullable=True) # mg/dL
    
    note = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, completed, referred_back
    
    refer_back_note = Column(Text, nullable=True) # Note when sending back to hospital
    
    req_bp = Column(Boolean, default=False)
    req_bs = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="appointments")

class HomeOPD(Base):
    __tablename__ = "home_opd"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True) # Optional link
    
    cid = Column(String) # For non-linked or manual entry
    name = Column(String, nullable=True) # If not linked
    
    type = Column(String) # 'patient', 'osm'
    note = Column(Text)
    source = Column(String) # 'hospital', 'hc'
    location = Column(String, nullable=True) # Zone name for filtering
    
    created_at = Column(String) # ISO date string
