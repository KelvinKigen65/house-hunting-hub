from django.contrib import admin

from .models import Booking, Inquiry, Profile, Property, SavedProperty


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "role", "phone", "created_at")
    list_filter = ("role",)
    search_fields = ("full_name", "user__email", "phone")


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "landlord", "area", "price", "status", "is_available", "created_at")
    list_filter = ("status", "is_available", "property_type", "area")
    search_fields = ("title", "location", "landlord__email")


@admin.register(SavedProperty)
class SavedPropertyAdmin(admin.ModelAdmin):
    list_display = ("tenant", "property", "created_at")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("property", "tenant", "landlord", "viewing_date", "viewing_time", "status")
    list_filter = ("status", "viewing_date")


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ("property", "tenant", "landlord", "is_read", "created_at")
    list_filter = ("is_read",)
