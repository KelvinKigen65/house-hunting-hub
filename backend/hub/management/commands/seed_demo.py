from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from hub.models import Booking, Inquiry, Profile, Property, SavedProperty


class Command(BaseCommand):
    help = "Seed local demo data for House Hunting Hub."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing demo data first.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            SavedProperty.objects.all().delete()
            Booking.objects.all().delete()
            Inquiry.objects.all().delete()
            Property.objects.all().delete()
            Profile.objects.all().delete()
            User.objects.filter(username__in=["admin@example.com", "landlord@example.com", "tenant@example.com"]).delete()

        admin = self.create_user("admin@example.com", "Admin User", Profile.Role.ADMIN)
        landlord = self.create_user("landlord@example.com", "Grace Wanjiku", Profile.Role.LANDLORD, "+254 700 111 222")
        tenant = self.create_user("tenant@example.com", "Brian Mwangi", Profile.Role.TENANT, "+254 700 333 444")

        listings = [
            ("Spacious 2-Bedroom in Embu Town", "Blue Valley Estate, Embu", "Town Centre", 18000, 2, Property.PropertyType.APARTMENT, Property.Status.VERIFIED, ["water", "electricity", "parking", "security"]),
            ("Affordable Bedsitter near Kirimari", "Kirimari, near main road", "Kirimari", 6500, 1, Property.PropertyType.BEDSITTER, Property.Status.VERIFIED, ["water", "electricity"]),
            ("Family House in Runyenjes", "Runyenjes town outskirts", "Runyenjes", 25000, 3, Property.PropertyType.HOUSE, Property.Status.PENDING, ["water", "electricity", "parking", "garden"]),
        ]
        properties = []
        for title, location, area, price, beds, kind, status, amenities in listings:
            prop, _ = Property.objects.get_or_create(
                landlord=landlord,
                title=title,
                defaults={
                    "description": "Clean, convenient rental property with easy access to local amenities.",
                    "location": location,
                    "area": area,
                    "price": price,
                    "bedrooms": beds,
                    "bathrooms": 1,
                    "property_type": kind,
                    "amenities": amenities,
                    "status": status,
                    "is_available": True,
                },
            )
            properties.append(prop)

        SavedProperty.objects.get_or_create(tenant=tenant, property=properties[0])
        Booking.objects.get_or_create(
            tenant=tenant,
            landlord=landlord,
            property=properties[0],
            viewing_date="2026-06-20",
            viewing_time="10:00 AM",
            defaults={"message": "I would like to view it this weekend."},
        )
        Inquiry.objects.get_or_create(
            tenant=tenant,
            landlord=landlord,
            property=properties[1],
            message="Is the rent inclusive of water?",
        )

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write("Admin: admin@example.com / password123")
        self.stdout.write("Landlord: landlord@example.com / password123")
        self.stdout.write("Tenant: tenant@example.com / password123")

    def create_user(self, email, full_name, role, phone=""):
        user, created = User.objects.get_or_create(username=email, defaults={"email": email})
        if created:
            user.set_password("password123")
            user.save(update_fields=["password"])
        Profile.objects.update_or_create(user=user, defaults={"full_name": full_name, "role": role, "phone": phone})
        return user
