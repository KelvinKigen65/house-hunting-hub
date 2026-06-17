import json
import os
from decimal import Decimal
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Booking, Inquiry, Profile, Property, SavedProperty


def payload(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}


def bad(message, status=400):
    return JsonResponse({"error": message}, status=status)


def api_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return bad("Authentication required.", 401)
        return view_func(request, *args, **kwargs)

    return wrapper


def admin_user(user):
    return bool(user.is_authenticated and hasattr(user, "profile") and user.profile.role == Profile.Role.ADMIN)


def landlord_user(user):
    return bool(
        user.is_authenticated
        and hasattr(user, "profile")
        and user.profile.role in [Profile.Role.LANDLORD, Profile.Role.ADMIN]
    )


def money(value):
    return float(value) if isinstance(value, Decimal) else value


def profile_json(profile):
    return {
        "id": profile.user_id,
        "email": profile.user.email,
        "full_name": profile.full_name,
        "phone": profile.phone,
        "avatar_url": profile.avatar_url,
        "role": profile.role,
        "created_at": profile.created_at.isoformat(),
        "updated_at": profile.updated_at.isoformat(),
    }


def user_json(user):
    profile = getattr(user, "profile", None)
    return {
        "id": user.id,
        "email": user.email,
        "user_metadata": profile_json(profile) if profile else {},
        "profile": profile_json(profile) if profile else None,
    }


def property_json(prop, include_landlord=False):
    data = {
        "id": prop.id,
        "landlord_id": prop.landlord_id,
        "title": prop.title,
        "description": prop.description,
        "location": prop.location,
        "area": prop.area,
        "price": money(prop.price),
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "property_type": prop.property_type,
        "amenities": prop.amenities,
        "images": prop.images,
        "status": prop.status,
        "admin_note": prop.admin_note,
        "is_available": prop.is_available,
        "views_count": prop.views_count,
        "created_at": prop.created_at.isoformat(),
        "updated_at": prop.updated_at.isoformat(),
    }
    if include_landlord and hasattr(prop.landlord, "profile"):
        data["profiles"] = profile_json(prop.landlord.profile)
        data["landlord"] = profile_json(prop.landlord.profile)
    return data


def booking_json(booking):
    viewing_date = booking.viewing_date.isoformat() if hasattr(booking.viewing_date, "isoformat") else booking.viewing_date
    return {
        "id": booking.id,
        "property_id": booking.property_id,
        "tenant_id": booking.tenant_id,
        "landlord_id": booking.landlord_id,
        "viewing_date": viewing_date,
        "viewing_time": booking.viewing_time,
        "message": booking.message,
        "status": booking.status,
        "created_at": booking.created_at.isoformat(),
        "updated_at": booking.updated_at.isoformat(),
        "properties": property_json(booking.property),
        "property": property_json(booking.property),
        "profiles": profile_json(booking.tenant.profile) if hasattr(booking.tenant, "profile") else None,
        "tenant": profile_json(booking.tenant.profile) if hasattr(booking.tenant, "profile") else None,
    }


def inquiry_json(inquiry):
    return {
        "id": inquiry.id,
        "property_id": inquiry.property_id,
        "tenant_id": inquiry.tenant_id,
        "landlord_id": inquiry.landlord_id,
        "message": inquiry.message,
        "reply": inquiry.reply,
        "replied_at": inquiry.replied_at.isoformat() if inquiry.replied_at else None,
        "is_read": inquiry.is_read,
        "created_at": inquiry.created_at.isoformat(),
        "updated_at": inquiry.updated_at.isoformat(),
        "properties": property_json(inquiry.property),
        "property": property_json(inquiry.property),
        "profiles": profile_json(inquiry.tenant.profile) if hasattr(inquiry.tenant, "profile") else None,
        "tenant": profile_json(inquiry.tenant.profile) if hasattr(inquiry.tenant, "profile") else None,
    }


@require_http_methods(["GET"])
def health(_request):
    return JsonResponse({"status": "ok", "service": "house-hunting-hub-api"})


@require_http_methods(["GET"])
def public_stats(_request):
    return JsonResponse({"stats": {
        "properties": Property.objects.filter(status=Property.Status.VERIFIED).count(),
        "landlords": Profile.objects.filter(role=Profile.Role.LANDLORD).count(),
        "tenants": Profile.objects.filter(role=Profile.Role.TENANT).count(),
    }})


@csrf_exempt
@api_login_required
@require_http_methods(["POST"])
def upload_media(request):
    file_obj = request.FILES.get("file")
    if not file_obj:
        return bad("No file was uploaded.")
    if not file_obj.content_type.startswith("image/"):
        return bad("Only image uploads are supported.")

    safe_name = os.path.basename(file_obj.name).replace(" ", "_")
    path = default_storage.save(f"house-images/{request.user.id}/{timezone.now().strftime('%Y%m%d%H%M%S%f')}-{safe_name}", file_obj)
    return JsonResponse({
        "path": path,
        "url": f"{settings.MEDIA_URL}{path}",
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data = payload(request)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or data.get("fullName") or "").strip()
    role = data.get("role") or Profile.Role.TENANT
    if not email or not password or not full_name:
        return bad("Email, password, and full name are required.")
    if role not in [Profile.Role.TENANT, Profile.Role.LANDLORD]:
        return bad("Invalid role.")
    if User.objects.filter(username=email).exists():
        return bad("An account with this email already exists.", 409)

    user = User.objects.create_user(username=email, email=email, password=password)
    Profile.objects.create(user=user, full_name=full_name, phone=data.get("phone", ""), role=role)
    login(request, user)
    return JsonResponse({"user": user_json(user)}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    data = payload(request)
    user = authenticate(request, username=(data.get("email") or "").strip().lower(), password=data.get("password") or "")
    if not user:
        return bad("Invalid email or password.", 401)
    login(request, user)
    return JsonResponse({"user": user_json(user)})


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@require_http_methods(["GET"])
def me(request):
    return JsonResponse({"user": user_json(request.user) if request.user.is_authenticated else None})


@csrf_exempt
@api_login_required
@require_http_methods(["GET", "PATCH"])
def profile_detail(request):
    if request.method == "GET":
        return JsonResponse({"profile": profile_json(request.user.profile)})
    data = payload(request)
    profile = request.user.profile
    profile.full_name = data.get("full_name", profile.full_name)
    profile.phone = data.get("phone", profile.phone)
    profile.avatar_url = data.get("avatar_url", profile.avatar_url)
    profile.save()
    return JsonResponse({"profile": profile_json(profile)})


@api_login_required
@require_http_methods(["GET"])
def profile_list(request):
    if not admin_user(request.user):
        return bad("Admin access required.", 403)
    profiles = Profile.objects.select_related("user").order_by("-created_at")
    role = request.GET.get("role")
    if role and role != "all":
        profiles = profiles.filter(role=role)
    return JsonResponse({"profiles": [profile_json(profile) for profile in profiles]})


@require_http_methods(["GET"])
def profile_public(_request, user_id):
    profile = get_object_or_404(Profile.objects.select_related("user"), user_id=user_id)
    return JsonResponse({"profile": profile_json(profile)})


@csrf_exempt
@api_login_required
@require_http_methods(["PATCH"])
def profile_role(request, user_id):
    if not admin_user(request.user):
        return bad("Admin access required.", 403)
    role = payload(request).get("role")
    if role not in Profile.Role.values:
        return bad("Invalid role.")
    profile = get_object_or_404(Profile, user_id=user_id)
    profile.role = role
    profile.save(update_fields=["role", "updated_at"])
    return JsonResponse({"profile": profile_json(profile)})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def properties(request):
    if request.method == "GET":
        props = Property.objects.select_related("landlord", "landlord__profile")
        if request.GET.get("public") in ["true", "1"]:
            props = props.filter(status=Property.Status.VERIFIED, is_available=True)
        if request.GET.get("landlord_id"):
            props = props.filter(landlord_id=request.GET["landlord_id"])
        if request.GET.get("status") and request.GET["status"] != "all":
            props = props.filter(status=request.GET["status"])
        if request.GET.get("available") in ["true", "1"]:
            props = props.filter(is_available=True)
        if request.GET.get("area"):
            props = props.filter(area=request.GET["area"])
        if request.GET.get("property_type"):
            props = props.filter(property_type=request.GET["property_type"])
        if request.GET.get("q"):
            q = request.GET["q"]
            props = props.filter(Q(title__icontains=q) | Q(location__icontains=q) | Q(description__icontains=q))
        return JsonResponse({"properties": [property_json(prop, include_landlord=True) for prop in props]})

    if not landlord_user(request.user):
        return bad("Landlord access required.", 403)
    data = payload(request)
    prop = Property.objects.create(
        landlord=request.user,
        title=data.get("title", "").strip(),
        description=data.get("description", ""),
        location=data.get("location", "").strip(),
        area=data.get("area", "").strip(),
        price=data.get("price") or 0,
        bedrooms=data.get("bedrooms") or 1,
        bathrooms=data.get("bathrooms") or 1,
        property_type=data.get("property_type") or Property.PropertyType.APARTMENT,
        amenities=data.get("amenities") or [],
        images=data.get("images") or [],
        status=data.get("status") if admin_user(request.user) and data.get("status") in Property.Status.values else Property.Status.PENDING,
        is_available=data.get("is_available", True),
    )
    return JsonResponse({"property": property_json(prop)}, status=201)


@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE"])
def property_detail(request, property_id):
    prop = get_object_or_404(Property.objects.select_related("landlord", "landlord__profile"), id=property_id)
    if request.method == "GET":
        return JsonResponse({"property": property_json(prop, include_landlord=True)})
    if not request.user.is_authenticated or (request.user != prop.landlord and not admin_user(request.user)):
        return bad("You do not have permission to manage this property.", 403)
    if request.method == "DELETE":
        prop.delete()
        return JsonResponse({"ok": True})
    data = payload(request)
    for field in ["title", "description", "location", "area", "price", "bedrooms", "bathrooms", "property_type", "amenities", "images", "is_available"]:
        if field in data:
            setattr(prop, field, data[field])
    if admin_user(request.user):
        if data.get("status") in Property.Status.values:
            prop.status = data["status"]
        if "admin_note" in data:
            prop.admin_note = data["admin_note"] or ""
    prop.save()
    return JsonResponse({"property": property_json(prop, include_landlord=True)})


@csrf_exempt
@require_http_methods(["POST"])
def property_views(_request, property_id):
    prop = get_object_or_404(Property, id=property_id)
    prop.views_count += 1
    prop.save(update_fields=["views_count", "updated_at"])
    return JsonResponse({"views_count": prop.views_count})


@csrf_exempt
@api_login_required
@require_http_methods(["GET", "POST"])
def saved_properties(request):
    if request.method == "GET":
        saved = SavedProperty.objects.select_related("property").filter(tenant=request.user)
        return JsonResponse({"saved_properties": [{"property_id": item.property_id, "properties": property_json(item.property)} for item in saved]})
    prop = get_object_or_404(Property, id=payload(request).get("property_id"))
    item, created = SavedProperty.objects.get_or_create(tenant=request.user, property=prop)
    return JsonResponse({"saved": {"property_id": item.property_id, "properties": property_json(item.property)}}, status=201 if created else 200)


@csrf_exempt
@api_login_required
@require_http_methods(["DELETE"])
def saved_property_detail(request, property_id):
    SavedProperty.objects.filter(tenant=request.user, property_id=property_id).delete()
    return JsonResponse({"ok": True})


@csrf_exempt
@api_login_required
@require_http_methods(["GET", "POST"])
def bookings(request):
    if request.method == "GET":
        records = Booking.objects.select_related("property", "tenant", "tenant__profile")
        records = records.filter(landlord=request.user) if request.GET.get("scope") == "landlord" else records.filter(tenant=request.user)
        if request.GET.get("status"):
            records = records.filter(status=request.GET["status"])
        return JsonResponse({"bookings": [booking_json(booking) for booking in records]})
    data = payload(request)
    prop = get_object_or_404(Property, id=data.get("property_id"))
    booking = Booking.objects.create(
        property=prop,
        tenant=request.user,
        landlord=prop.landlord,
        viewing_date=data.get("viewing_date"),
        viewing_time=data.get("viewing_time"),
        message=data.get("message", ""),
    )
    return JsonResponse({"booking": booking_json(booking)}, status=201)


@csrf_exempt
@api_login_required
@require_http_methods(["PATCH"])
def booking_detail(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    if request.user not in [booking.tenant, booking.landlord] and not admin_user(request.user):
        return bad("You do not have permission to update this booking.", 403)
    status = payload(request).get("status")
    if status not in Booking.Status.values:
        return bad("Invalid booking status.")
    booking.status = status
    booking.save(update_fields=["status", "updated_at"])
    return JsonResponse({"booking": booking_json(booking)})


@csrf_exempt
@api_login_required
@require_http_methods(["GET", "POST"])
def inquiries(request):
    if request.method == "GET":
        records = Inquiry.objects.select_related("property", "tenant", "tenant__profile")
        records = records.filter(landlord=request.user) if request.GET.get("scope") == "landlord" else records.filter(tenant=request.user)
        return JsonResponse({"inquiries": [inquiry_json(inquiry) for inquiry in records]})
    data = payload(request)
    prop = get_object_or_404(Property, id=data.get("property_id"))
    inquiry = Inquiry.objects.create(property=prop, tenant=request.user, landlord=prop.landlord, message=data.get("message", "").strip())
    return JsonResponse({"inquiry": inquiry_json(inquiry)}, status=201)


@csrf_exempt
@api_login_required
@require_http_methods(["PATCH"])
def inquiry_reply(request, inquiry_id):
    inquiry = get_object_or_404(Inquiry, id=inquiry_id)
    if request.user != inquiry.landlord and not admin_user(request.user):
        return bad("You do not have permission to reply to this inquiry.", 403)
    inquiry.reply = payload(request).get("reply", "").strip()
    inquiry.replied_at = timezone.now()
    inquiry.is_read = True
    inquiry.save(update_fields=["reply", "replied_at", "is_read", "updated_at"])
    return JsonResponse({"inquiry": inquiry_json(inquiry)})


@api_login_required
@require_http_methods(["GET"])
def admin_dashboard(request):
    if not admin_user(request.user):
        return bad("Admin access required.", 403)
    return JsonResponse({"stats": {
        "users": Profile.objects.count(),
        "landlords": Profile.objects.filter(role=Profile.Role.LANDLORD).count(),
        "tenants": Profile.objects.filter(role=Profile.Role.TENANT).count(),
        "properties": Property.objects.count(),
        "pending_properties": Property.objects.filter(status=Property.Status.PENDING).count(),
        "verified_properties": Property.objects.filter(status=Property.Status.VERIFIED).count(),
        "bookings": Booking.objects.count(),
        "inquiries": Inquiry.objects.count(),
    }})


@api_login_required
@require_http_methods(["GET"])
def landlord_dashboard(request):
    if not landlord_user(request.user):
        return bad("Landlord access required.", 403)
    props = Property.objects.filter(landlord=request.user)
    bookings_by_status = Booking.objects.filter(landlord=request.user).values("status").annotate(total=Count("id"))
    return JsonResponse({"stats": {
        "total": props.count(),
        "verified": props.filter(status=Property.Status.VERIFIED).count(),
        "pending": props.filter(status=Property.Status.PENDING).count(),
        "bookings": {item["status"]: item["total"] for item in bookings_by_status},
    }})


@api_login_required
@require_http_methods(["GET"])
def tenant_dashboard(request):
    bookings_qs = Booking.objects.filter(tenant=request.user)
    return JsonResponse({"stats": {
        "saved": SavedProperty.objects.filter(tenant=request.user).count(),
        "bookings": bookings_qs.count(),
        "pending": bookings_qs.filter(status=Booking.Status.PENDING).count(),
        "confirmed": bookings_qs.filter(status=Booking.Status.CONFIRMED).count(),
    }})
