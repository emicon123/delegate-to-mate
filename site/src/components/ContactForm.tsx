import { useActionState } from "react";
import { z } from "zod";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY as string | undefined;

const contactSchema = z.object({
  name: z.string().trim().min(1, { error: "Podaj imię i nazwisko." }),
  email: z.string().trim().min(1, { error: "Podaj adres e-mail." }).pipe(z.email({ error: "Podaj poprawny adres e-mail." })),
  message: z.string().trim().min(10, { error: "Wiadomość jest za krótka (min. 10 znaków)." }),
  website: z.string().optional(),
});

type FormState = { errors: Record<string, string>; message: string; status: string } | null;

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const raw = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    if (raw.website) {
      return { status: "success", message: "Dziękujemy! Wiadomość została wysłana.", errors: {} };
    }

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field && !errors[field]) errors[field] = issue.message;
      }
      return { status: "error", message: "Popraw zaznaczone pola i spróbuj ponownie.", errors };
    }

    if (!ACCESS_KEY) {
      return {
        status: "error",
        message: "Formularz nie jest skonfigurowany (brak klucza API). Skontaktuj się telefonicznie: (+48) 796 017 986.",
        errors: {},
      };
    }

    try {
      const submitData = new FormData();
      submitData.append("access_key", ACCESS_KEY);
      submitData.append("name", parsed.data.name);
      submitData.append("email", parsed.data.email);
      submitData.append("message", parsed.data.message);
      submitData.append("subject", `Nowa wiadomość z delegatetomate.pl od ${parsed.data.name}`);
      submitData.append("from_name", "delegatetomate.pl");
      submitData.append("botcheck", "");

      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        body: submitData,
      });

      const data = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Request failed ${response.status}`);
      }

      return { status: "success", message: "Dziękujemy! Wiadomość została wysłana. Odpowiemy tego samego dnia.", errors: {} };
    } catch {
      return {
        status: "error",
        message: "Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwoń: (+48) 796 017 986.",
        errors: {},
      };
    }
  }, null);

  const errors = state?.errors ?? {};
  const status = state?.status;
  const statusMessage = state?.message ?? "";

  return (
    <form noValidate action={formAction} aria-describedby="form-status">
      <div style={{ position: "absolute", left: "-5000px", top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
        <label htmlFor="contact-website">Nie wypełniaj</label>
        <input type="text" name="website" id="contact-website" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />
      </div>

      <div>
        <label htmlFor="contact-name">Imię i nazwisko</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          required
        />
        {errors.name && (
          <p className="field-error" id="contact-name-error">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email">E-mail</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          required
        />
        {errors.email && (
          <p className="field-error" id="contact-email-error">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message">Wiadomość</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          required
        />
        {errors.message && (
          <p className="field-error" id="contact-message-error">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={isPending} className="btn btn--amber" style={{ width: "100%", marginTop: 6 }}>
        {isPending ? "Wysyłanie…" : "Wyślij wiadomość"}
      </button>

      <p style={{ margin: "10px 0 0", fontSize: 12, color: "#64748b", textAlign: "center" }}>
        Wysyłając, akceptujesz{" "}
        <a href={`${import.meta.env.BASE_URL}polityka-prywatnosci/`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
          politykę prywatności
        </a>
        .
      </p>

      {status === "success" && (
        <p id="form-status" className="form-status form-status--success" role="status">
          {statusMessage}
        </p>
      )}
      {status === "error" && (
        <p id="form-status" className="form-status form-status--error" role="alert">
          {statusMessage}
        </p>
      )}
    </form>
  );
}
