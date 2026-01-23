// utils/imageToBase64.ts
export const imageToBase64 = async (url: string): Promise<string> => {
  if (!url) return "";

  try {
    const res = await fetch(url);
    const blob = await res.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image to base64:", url, err);
    return "";
  }
};
