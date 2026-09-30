import PropertyAmenitiesManager from "@/components/my/listing/amenity/PropertyAmenitiesManager";

export default function SuperAdminAmenitiesPage() {
  return (
    <PropertyAmenitiesManager
      eyebrow="Super Admin Panel"
      title="Property Amenities Options"
      sub="Master configuration of property amenity categories (Basic, Security, Parking, Fitness, etc.) and options."
    />
  );
}
