import emailjs from "@emailjs/browser";

export async function sendEmailByForm(form: HTMLFormElement) {
   const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
   const TEMPLATE_ID = importMetaEnv("VITE_EMAILJS_TEMPLATE_ID");
   const PUBLIC_KEY = importMetaEnv("VITE_EMAILJS_PUBLIC_KEY");

   return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, {
      publicKey: PUBLIC_KEY,
   });
}

// Helper para fallar explícito si falta una env
function importMetaEnv<K extends keyof ImportMetaEnv>(k: K): string {
   const v = import.meta.env[k];
   if (!v) throw new Error(`Falta env ${k}`);
   return v;
}
