'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('our-story-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
    if (state?.deviceToken) {
      config.headers['X-Device-Token'] = state.deviceToken;
    }
  }
  return config;
});

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<T>(url);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, setData };
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await api.get<T>(url);
  return res.data;
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await api.post<T>(url, body);
  return res.data;
}

export async function apiPut<T>(url: string, body: any): Promise<T> {
  const res = await api.put<T>(url, body);
  return res.data;
}

export async function apiDelete(url: string): Promise<void> {
  await api.delete(url);
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<{ url: string }>('/upload', formData);
  return res.data.url;
}
