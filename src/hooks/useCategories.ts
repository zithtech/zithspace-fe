"use client";
import { useEffect, useState } from "react";
import { Category } from "@/types/category";
import { CategoryService } from "@/services/categoryService";

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CategoryService.getAll().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
