"use client";
import { useEffect, useState } from "react";
import { Category } from "@/types/category";
import { CategoryService } from "@/services/categoryService";

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await CategoryService.getAll();
        setData(res);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { data, loading };
}
