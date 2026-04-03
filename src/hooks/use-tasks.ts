"use client";

import { useState, useEffect, useCallback } from "react";

interface Task {
  id: string;
  propertyId: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  dueDate: string;
  assigneeId?: string;
  property?: { name: string };
  assignee?: { name: string };
}

export function useTasks(propertyId?: string, status?: string, type?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (propertyId) params.set("propertyId", propertyId);
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [propertyId, status, type]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchTasks();
  };

  return { tasks, loading, error, refetch: fetchTasks, updateTaskStatus };
}
