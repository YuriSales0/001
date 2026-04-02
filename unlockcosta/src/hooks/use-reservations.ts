"use client";

import { useState, useEffect, useCallback } from "react";

interface Reservation {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  platform?: string;
  status: string;
  property?: { name: string };
}

export function useReservations(propertyId?: string, status?: string) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (propertyId) params.set("propertyId", propertyId);
      if (status) params.set("status", status);
      const res = await fetch(`/api/reservations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reservations");
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [propertyId, status]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return { reservations, loading, error, refetch: fetchReservations };
}
