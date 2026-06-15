from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me, name="me"),
    path("profile/", views.profile_detail, name="profile"),
    path("profiles/", views.profile_list, name="profile-list"),
    path("profiles/<int:user_id>/role/", views.profile_role, name="profile-role"),
    path("properties/", views.properties, name="properties"),
    path("properties/<int:property_id>/", views.property_detail, name="property-detail"),
    path("properties/<int:property_id>/views/", views.property_views, name="property-views"),
    path("saved-properties/", views.saved_properties, name="saved-properties"),
    path("saved-properties/<int:property_id>/", views.saved_property_detail, name="saved-property-detail"),
    path("bookings/", views.bookings, name="bookings"),
    path("bookings/<int:booking_id>/", views.booking_detail, name="booking-detail"),
    path("inquiries/", views.inquiries, name="inquiries"),
    path("inquiries/<int:inquiry_id>/reply/", views.inquiry_reply, name="inquiry-reply"),
    path("dashboard/admin/", views.admin_dashboard, name="admin-dashboard"),
    path("dashboard/landlord/", views.landlord_dashboard, name="landlord-dashboard"),
    path("dashboard/tenant/", views.tenant_dashboard, name="tenant-dashboard"),
]
