# House Hunting Hub Backend

Django JSON API for the House Hunting Hub app.

## Local Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo --reset
python manage.py runserver
```

API base URL: `http://127.0.0.1:8000/api/`

## Demo Accounts

- Admin: `admin@example.com` / `password123`
- Landlord: `landlord@example.com` / `password123`
- Tenant: `tenant@example.com` / `password123`
