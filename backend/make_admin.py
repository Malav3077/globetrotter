"""Promote a user to admin.

    python make_admin.py someone@example.com
"""

import sys

from app.database import SessionLocal
from app.models import User


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    email = sys.argv[1].lower()
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        print(f"no user with email {email}")
        db.close()
        sys.exit(1)

    user.is_admin = True
    db.commit()
    print(f"{email} is now an admin")
    db.close()


if __name__ == "__main__":
    main()
