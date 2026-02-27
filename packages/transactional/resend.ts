import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not defined in environment variables");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// For backward compatibility if needed, but we should update consumers
export const resend = new Proxy({} as Resend, {
  get: (target, prop, receiver) => {
    return Reflect.get(getResend(), prop, receiver);
  }
});