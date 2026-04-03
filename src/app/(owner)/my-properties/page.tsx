"use client";

import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockProperties = [
  {
    id: "1",
    name: "Villa Sunshine",
    address: "Calle del Mar 42, Marbella",
    status: "ACTIVE",
    occupancy: 78,
    monthlyRevenue: 3890,
  },
];

export default function PropertiesPage() {
  if (mockProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-navy-900">No Properties Yet</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          Your property will appear here once onboarded by your manager.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">My Properties</h1>
      <div className="grid gap-6">
        {mockProperties.map((p) => (
          <Card key={p.id} className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-64 h-48 sm:h-auto bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-navy-400" />
                </div>
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
                      <p className="text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" /> {p.address}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      {p.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-gray-500">Occupancy</p>
                      <p className="text-lg font-bold text-navy-900">{p.occupancy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Revenue</p>
                      <p className="text-lg font-bold text-navy-900">€{p.monthlyRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
