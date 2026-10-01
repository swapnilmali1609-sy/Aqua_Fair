import csv
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from accounts.models import Zone, Household, WaterDemandRequest, SystemAlert

class Command(BaseCommand):
    help = 'Imports real Nagar Parishad Wards and Household Registers (CSV/Excel exports) into AquaFair'

    def add_arguments(self, parser):
        parser.add_argument(
            '--wards',
            type=str,
            help='Path to Nagar Parishad Wards CSV file (e.g. wards.csv)',
            required=False
        )
        parser.add_argument(
            '--households',
            type=str,
            help='Path to Nagar Parishad Households / Consumer connections CSV file (e.g. households.csv)',
            required=False
        )
        parser.add_argument(
            '--replace',
            action='store_true',
            help='Wipes existing demo wards and households, replacing with pure real Nagar Parishad records'
        )

    def handle(self, *args, **options):
        wards_file = options.get('wards')
        households_file = options.get('households')
        replace = options.get('replace')

        if not wards_file and not households_file:
            raise CommandError("Please specify at least --wards <path> or --households <path>.")

        self.stdout.write(self.style.NOTICE("=== AquaFair Nagar Parishad Data Ingestion Engine ==="))

        with transaction.atomic():
            if replace:
                self.stdout.write(self.style.WARNING("Clearing prior wards and households as --replace was specified..."))
                WaterDemandRequest.objects.all().delete()
                Household.objects.all().delete()
                Zone.objects.all().delete()

            # 1. Ingest Wards CSV
            wards_map = {}
            if wards_file:
                if not os.path.exists(wards_file):
                    raise CommandError(f"Wards file not found: {wards_file}")

                self.stdout.write(f"Reading Wards CSV from {wards_file}...")
                with open(wards_file, 'r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    w_count = 0
                    for row in reader:
                        # Normalize keys (lowercase, trim)
                        clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                        
                        w_num = int(
                            clean_row.get('ward_number') or 
                            clean_row.get('ward_no') or 
                            clean_row.get('ward') or 
                            (w_count + 1)
                        )
                        raw_name = clean_row.get('name') or clean_row.get('ward_name') or f"Ward {w_num}"
                        name = raw_name if raw_name.lower().startswith('ward') else f"Ward {w_num} - {raw_name}"
                        sector_type = clean_row.get('sector_type') or 'Residential Colony'
                        elevation = clean_row.get('elevation_tier') or 'Standard'
                        timing = clean_row.get('supply_timing') or '06:00 AM - 08:30 AM'
                        hh_count = int(clean_row.get('households_count') or clean_row.get('total_houses') or 200)
                        target = float(clean_row.get('target_liters') or (hh_count * 500))

                        zone, created = Zone.objects.update_or_create(
                            ward_number=w_num,
                            defaults={
                                'name': name,
                                'sector_type': sector_type,
                                'elevation_tier': elevation,
                                'supply_timing': timing,
                                'households_count': hh_count,
                                'target_liters': target,
                                'delivered_liters': 0.0,
                                'status': 'Balanced',
                                'valve_percent': 90,
                                'flow_rate': 18.5,
                                'order': w_num
                            }
                        )
                        wards_map[w_num] = zone
                        w_count += 1
                        self.stdout.write(f"  -> [{ 'Created' if created else 'Updated' }] {zone.name} (Ward #{w_num})")

            # 2. Ingest Households CSV
            if households_file:
                if not os.path.exists(households_file):
                    raise CommandError(f"Households file not found: {households_file}")

                self.stdout.write(f"Reading Households CSV from {households_file}...")
                with open(households_file, 'r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    hh_count = 0
                    for row in reader:
                        clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                        
                        w_num = int(clean_row.get('ward_number') or clean_row.get('ward_no') or clean_row.get('ward') or 1)
                        target_zone = wards_map.get(w_num) or Zone.objects.filter(ward_number=w_num).first()
                        
                        if not target_zone:
                            target_zone = Zone.objects.create(
                                ward_number=w_num,
                                name=f"Ward {w_num} - Municipal Sector",
                                households_count=0,
                                target_liters=50000.0,
                                order=w_num
                            )
                            wards_map[w_num] = target_zone

                        hh_id = clean_row.get('household_id') or clean_row.get('consumer_id') or clean_row.get('property_id') or f"NP-W{w_num}-{1000 + hh_count}"
                        owner = clean_row.get('owner_name') or clean_row.get('resident_name') or clean_row.get('name') or 'Nagar Parishad Resident'
                        address = clean_row.get('address_or_lane') or clean_row.get('address') or clean_row.get('lane') or 'Lane 1'
                        phone = clean_row.get('phone') or clean_row.get('mobile') or ''
                        members = int(clean_row.get('members_count') or clean_row.get('members') or 4)
                        daily_quota = float(clean_row.get('daily_quota_liters') or (members * 135))
                        usage = float(clean_row.get('current_usage_liters') or round(daily_quota * 0.68, 1))
                        status_str = clean_row.get('meter_status') or 'Active'
                        abnormal = clean_row.get('abnormal_draw', '').lower() in ['true', '1', 'yes']

                        Household.objects.update_or_create(
                            household_id=hh_id,
                            defaults={
                                'zone': target_zone,
                                'owner_name': owner,
                                'address_or_lane': address,
                                'phone': phone,
                                'members_count': members,
                                'daily_quota_liters': daily_quota,
                                'current_usage_liters': usage,
                                'meter_status': status_str,
                                'abnormal_draw': abnormal,
                                'extra_water_granted': 0.0
                            }
                        )
                        hh_count += 1

                # Update zone households counts to match actual ingested count
                for zone in Zone.objects.all():
                    actual = zone.households.count()
                    if actual > 0:
                        zone.households_count = actual
                        zone.target_liters = actual * 500.0
                        zone.save()

                self.stdout.write(self.style.SUCCESS(f"Successfully processed {hh_count} household connections!"))

            # Log audit alert
            SystemAlert.objects.create(
                level='info',
                category='equity',
                title="CLI Nagar Parishad Data Ingestion Completed",
                message=f"CLI batch import updated {Zone.objects.count()} wards and {Household.objects.count()} households in AquaFair SCADA.",
                resolved=False
            )

        self.stdout.write(self.style.SUCCESS("All Nagar Parishad records successfully committed to AquaFair!"))
