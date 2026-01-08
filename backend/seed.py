from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models
from backend.user_auth import get_password_hash

# Create tables
models.Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    
    users = [
        {"username": "hospital", "role": "hospital", "loc": None},
        {"username": "admin", "role": "admin", "loc": None},
        
        {"username": "rph_chalem", "role": "hc", "loc": "สถานีอนามัยเฉลิมพระเกียรติ"},
        {"username": "rph_160", "role": "hc", "loc": "รพ.สต.หลักร้อยหกสิบ"},
        {"username": "rph_noisamakkhi", "role": "hc", "loc": "รพ.สต.บ้านน้อยสามัคคี"},
        {"username": "rph_puanpu", "role": "hc", "loc": "รพ.สต.บ้านปวนพุ"},
        {"username": "rph_nongmakaew", "role": "hc", "loc": "รพ.สต.บ้านหนองหมากแก้ว"},
    ]
    
    for u in users:
        curr = db.query(models.User).filter(models.User.username == u['username']).first()
        if not curr:
            print(f"Creating user {u['username']}")
            user = models.User(
                username=u['username'],
                password_hash=get_password_hash("1234"),
                role=u['role'],
                location_name=u['loc']
            )
            db.add(user)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_users()
