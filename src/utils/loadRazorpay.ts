export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // If the script is already loaded, resolve immediately
    if (document.getElementById('razorpay-checkout-script')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
