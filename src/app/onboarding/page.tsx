"use client";

import { useState } from "react";
import {
  Building2,
  Upload,
  Lock,
  Link2,
  ChevronRight,
  ChevronLeft,
  Check,
  MapPin,
  User,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const steps = [
  { id: 1, title: "Property Details", icon: Building2 },
  { id: 2, title: "Photos & Contract", icon: Camera },
  { id: 3, title: "Smart Lock Setup", icon: Lock },
  { id: 4, title: "Channel Connection", icon: Link2 },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => setCurrentStep(Math.min(currentStep + 1, 4));
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-navy-900" />
          <span className="font-bold text-navy-900">Hostmaster</span>
          <span className="text-gray-400 ml-2">/ Onboarding</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id
                    ? "bg-green-500 text-white"
                    : currentStep === step.id
                    ? "bg-navy-900 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-xs mt-1 text-gray-500 hidden sm:block">{step.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                  currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Property Details */}
        {currentStep === 1 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy-900">
                <MapPin className="h-5 w-5 text-gold-400" /> Property Details
              </CardTitle>
              <CardDescription>Enter the basic information about your property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Property Name</Label>
                <Input placeholder="e.g. Villa Sunshine" />
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input placeholder="Calle del Mar 42" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="Marbella" />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input placeholder="29601" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-navy-900"
                  placeholder="Beautiful beachfront villa with 3 bedrooms..."
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium text-navy-900 flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" /> Owner Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Owner Name</Label>
                    <Input placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Email</Label>
                    <Input type="email" placeholder="owner@email.com" />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Owner Phone</Label>
                  <Input placeholder="+49 170 1234567" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Photos & Contract */}
        {currentStep === 2 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy-900">
                <Camera className="h-5 w-5 text-gold-400" /> Photos & Contract
              </CardTitle>
              <CardDescription>Upload property photos and the management contract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Property Photos</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-navy-300 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Drag & drop photos here, or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB each</p>
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Management Contract</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-navy-300 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Upload signed management contract</p>
                  <p className="text-xs text-gray-400 mt-1">PDF up to 25MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Smart Lock */}
        {currentStep === 3 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy-900">
                <Lock className="h-5 w-5 text-gold-400" /> Smart Lock Setup
              </CardTitle>
              <CardDescription>Connect your Nuki smart lock for automated access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                This step is optional. You can connect your smart lock later from settings.
              </div>
              <div className="space-y-2">
                <Label>Nuki Smart Lock ID</Label>
                <Input placeholder="Enter your Nuki device ID" />
              </div>
              <div className="space-y-2">
                <Label>Nuki API Token</Label>
                <Input type="password" placeholder="Enter your Nuki API token" />
              </div>
              <Button variant="outline" className="gap-2">
                <Lock className="h-4 w-4" /> Test Connection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Channel Connection */}
        {currentStep === 4 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy-900">
                <Link2 className="h-5 w-5 text-gold-400" /> Channel Connections
              </CardTitle>
              <CardDescription>Connect your Airbnb and Booking.com listings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                    Air
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">Airbnb</p>
                    <p className="text-xs text-gray-500">Sync reservations automatically</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    B.c
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">Booking.com</p>
                    <p className="text-xs text-gray-500">Sync reservations automatically</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
                Channel connections use webhook placeholders. Full iCal/API sync coming soon.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {currentStep < 4 ? (
            <Button onClick={nextStep} className="gap-2 bg-navy-900 hover:bg-navy-800">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4" /> Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
