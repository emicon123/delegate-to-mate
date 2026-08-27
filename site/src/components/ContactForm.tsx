import { useState, type FormEvent } from 'react';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY as string | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { name?: string; email?: string; message?: string };
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitState>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Podaj imię i nazwisko.';
    if (!email.trim()) next.email = 'Podaj adres e-mail.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Podaj poprawny adres e-mail.';
    if (!message.trim()) next.message = 'Wpisz wiadomość.';
    else if (message.trim().length < 10) next.message = 'Wiadomość jest za krótka (min. 10 znaków).';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (honeypot) {
      setStatus('success');
      setStatusMessage('Dziękujemy! Wiadomość została wysłana.');
      return;
    }

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setStatus('error');
      setStatusMessage('Popraw zaznaczone pola i spróbuj ponownie.');
      return;
    }

    if (!ACCESS_KEY) {
      setStatus('error');
      setStatusMessage('Formularz nie jest skonfigurowany (brak klucza API). Skontaktuj się telefonicznie: (+48) 796 017 986.');
      return;
    }

    setStatus('submitting');
    setStatusMessage('');

    try {
      const formData = new FormData();
      formData.append('access_key', ACCESS_KEY);
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('message', message.trim());
      formData.append('subject', `Nowa wiadomość z delegatetomate.pl od ${name.trim()}`);
      formData.append('from_name', 'delegatetomate.pl');
      formData.append('botcheck', '');

      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Request failed ${response.status}`);
      }

      setStatus('success');
      setStatusMessage('Dziękujemy! Wiadomość została wysłana. Odpowiemy tego samego dnia.');
      setName('');
      setEmail('');
      setMessage('');
      setErrors({});
    } catch {
      setStatus('error');
      setStatusMessage('Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwoń: (+48) 796 017 986.');
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-describedby="form-status">
      <div style={{ position: 'absolute', left: '-5000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="contact-website">Nie wypełniaj</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="contact-name">Imię i nazwisko</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          required
        />
        {errors.message && (
          <p className="field-error" id="contact-message-error">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={status === 'submitting'} className="btn btn--amber" style={{ width: '100%', marginTop: 6 }}>
        {status === 'submitting' ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>

      <p style={{ margin: '10px 0 0', fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Wysyłając, akceptujesz <a href={`${import.meta.env.BASE_URL}polityka-prywatnosci/`} style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>politykę prywatności</a>.
      </p>

      {status === 'success' && (
        <p id="form-status" className="form-status form-status--success" role="status">
          {statusMessage}
        </p>
      )}
      {status === 'error' && (
        <p id="form-status" className="form-status form-status--error" role="alert">
          {statusMessage}
        </p>
      )}
    </form>
  );
}
