from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("stats/", views.public_stats),
    path("auth/register/", views.register),
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
    path("auth/me/", views.me),
    path("media/upload/", views.upload_media),
    path("profile/", views.profile_detail),
    path("profiles/", views.profile_list),
    path("profiles/<int:user_id>/", views.profile_public),
    path("profiles/<int:user_id>/role/", views.profile_role),
    path("properties/", views.properties),
    path("properties/<int:property_id>/", views.property_detail),
    path("properties/<int:property_id>/views/", views.property_views),
    path("saved-properties/", views.saved_properties),
    path("saved-properties/<int:property_id>/", views.saved_property_detail),
    path("bookings/", views.bookings),
    path("bookings/<int:booking_id>/", views.booking_detail),
    path("inquiries/", views.inquiries),
    path("inquiries/<int:inquiry_id>/reply/", views.inquiry_reply),
    path("dashboard/admin/", views.admin_dashboard),
    path("dashboard/landlord/", views.landlord_dashboard),
    path("dashboard/tenant/", views.tenant_dashboard),
]
