"use client";

import { useState, useEffect, useCallback } from "react";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  status: string;
  commissionRate: number;
  ownerId: string;
  owner?: { name: string; email: string };
  _count?: { reservations: number; tasks: number };
}

export function useProperties(ownerId?: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ownerId) params.set("ownerId", ownerId);
      const res = await fetch(`/api/properties?${params}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, refetch: fetchProperties };
}
