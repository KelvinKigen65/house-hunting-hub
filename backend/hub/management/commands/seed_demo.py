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

        properties = [
            {
                "title": "Spacious 2-Bedroom in Embu Town",
                "description": "Bright rooms, reliable water, secure compound, and easy access to town.",
                "location": "Blue Valley Estate, Embu",
                "area": "Town Centre",
                "price": 18000,
                "bedrooms": 2,
                "bathrooms": 1,
                "property_type": Property.PropertyType.APARTMENT,
                "amenities": ["water", "electricity", "parking", "security"],
                "status": Property.Status.VERIFIED,
            },
            {
                "title": "Affordable Bedsitter near Kirimari",
                "description": "Compact bedsitter ideal for students or young professionals.",
                "location": "Kirimari, near main road",
                "area": "Kirimari",
                "price": 6500,
                "bedrooms": 1,
                "bathrooms": 1,
                "property_type": Property.PropertyType.BEDSITTER,
                "amenities": ["water", "electricity"],
                "status": Property.Status.VERIFIED,
            },
            {
                "title": "Family House in Runyenjes",
                "description": "Quiet family home with a small garden and parking.",
                "location": "Runyenjes town outskirts",
                "area": "Runyenjes",
                "price": 25000,
                "bedrooms": 3,
                "bathrooms": 2,
                "property_type": Property.PropertyType.HOUSE,
                "amenities": ["water", "electricity", "parking", "garden"],
                "status": Property.Status.PENDING,
            },
        ]

        created = []
        for item in properties:
            prop, _ = Property.objects.get_or_create(
                landlord=landlord,
                title=item["title"],
                defaults={**item, "is_available": True},
            )
            created.append(prop)

        SavedProperty.objects.get_or_create(tenant=tenant, property=created[0])
        Booking.objects.get_or_create(
            tenant=tenant,
            landlord=landlord,
            property=created[0],
            viewing_date="2026-06-20",
            viewing_time="10:00 AM",
            defaults={"message": "I would like to view it this weekend."},
        )
        Inquiry.objects.get_or_create(
            tenant=tenant,
            landlord=landlord,
            property=created[1],
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
        Profile.objects.update_or_create(
            user=user,
            defaults={"full_name": full_name, "role": role, "phone": phone},
        )
        return user
