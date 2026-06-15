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

## Main Endpoints

- `GET /api/health/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `GET|PATCH /api/profile/`
- `GET|POST /api/properties/`
- `GET|PATCH|DELETE /api/properties/<id>/`
- `POST /api/properties/<id>/views/`
- `GET|POST /api/saved-properties/`
- `DELETE /api/saved-properties/<property_id>/`
- `GET|POST /api/bookings/`
- `PATCH /api/bookings/<id>/`
- `GET|POST /api/inquiries/`
- `PATCH /api/inquiries/<id>/reply/`
- `GET /api/dashboard/admin/`
- `GET /api/dashboard/landlord/`
- `GET /api/dashboard/tenant/`
