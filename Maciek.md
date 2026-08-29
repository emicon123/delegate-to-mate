# Maciek.md — jak wprowadzać zmiany na delegatetomate.pl

Dla Ciebie i dla Twojego agenta AI (OpenCode Desktop — aplikacja z oknem, nie Terminal). Opisz agentowi zmianę słowami — resztę robi on.

## Jednorazowa instalacja (ręcznie, zanim agent AI wejdzie do gry)

Instalujemy **OpenCode Desktop** (aplikacja z oknem, jak każdy inny program na Macu):

- Wejdź na [opencode.ai/download](https://opencode.ai/download), pobierz wersję na Maca.
- Zainstaluj jak zwykłą aplikację (otwórz pobrany plik, przenieś do Aplikacji, uruchom).
- **Dodaj projekt** — otwórz/wskaż folder z kodem strony (`~/delegate-to-mate` — jeśli go jeszcze nie ma, patrz niżej, agent go pobierze przy pierwszym uruchomieniu).
- **Utwórz nową sesję** w tym projekcie (skrót `Ctrl+N`, albo przycisk "New session" w oknie). Sesje same się zapisują — jeśli Maciek zamknie aplikację w połowie pracy, po ponownym otwarciu wszystko wraca dokładnie tam, gdzie było.
- **Wybierz darmowy model** — przy pierwszym uruchomieniu aplikacja poprosi o wybór modelu. Wybierz cokolwiek oznaczone "Free" w OpenCode Zen (np. **MiMo Free**, **DeepSeek Free**, **Muse** — wszystkie są dobre do tego typu pracy).
- W polu do pisania napisz `@Maciek.md` i wybierz ten plik z podpowiedzi (albo po prostu napisz: *"Przeczytaj Maciek.md z repo emicon123/delegate-to-mate i skonfiguruj resztę"*, jeśli repo jeszcze nie jest otwarte jako projekt).
- Od tego momentu wszystko poniżej robi agent **wewnątrz aplikacji** — Maciek nie musi sam otwierać żadnego Terminala, chyba że poniższa instrukcja wyraźnie o to poprosi (jeden konkretny wyjątek niżej).

---

## Instrukcja dla agenta: kim jest Maciek

Maciek jest **kompletnie nietechniczny** — nie zna pojęć typu commit, repo, build, deploy, terminal, localhost. Zakładaj to zawsze, nie tylko przy problemach (patrz też sekcja o problemach niżej):

- Tłumacz zwykłym językiem, co się dzieje i dlaczego, zamiast rzucać terminologią.
- Jeśli coś może wymagać wyjaśnienia, **zapytaj wprost**, np. "czy wytłumaczyć, co to znaczy?", zamiast zakładać że wie albo że się dopyta sam.
- Nigdy nie zakładaj wiedzy, której nie potwierdził.

## Instrukcja dla agenta — konfiguracja środowiska (pierwsza sesja)

Zakładaj "goły" Mac — nic poniższego może nie być zainstalowane. Rób to przez wbudowane wykonywanie poleceń w OpenCode Desktop (nie przez każenie Maćkowi otwierać osobnego Terminala), z jednym wyjątkiem niżej.

- `brew --version` → jest? → `brew install git node`, gotowe.
- Nie ma? → **jedyny moment wymagający Maćka osobiście, i jedyny, gdzie potrzebny prawdziwy Terminal**: instalator Homebrew poprosi o hasło do jego konta Mac — żaden agent go nie wpisuje ani nie widzi. Poprowadź go dosłownie: "Otwórz Launchpad (rakieta w Docku) → wpisz Terminal → kliknij ikonkę". W oknie, które się otworzy, niech wklei komendę z [brew.sh](https://brew.sh) i wpisze swoje hasło, kiedy poprosi (nic nie będzie widać przy pisaniu hasła — to normalne). Poczekaj aż potwierdzi koniec, wróć do pracy w OpenCode Desktop, uruchom `brew install git node`.
- Zweryfikuj: `git --version`, `node --version`, `npm --version`.
- `ls ~/delegate-to-mate` istnieje? Nie → `git clone https://github.com/emicon123/delegate-to-mate.git`.
- `site/node_modules` istnieje? Nie → `cd site && npm install`.
- Kolejne sesje: szybkie `git --version`/`node --version` wystarczy jako formalność.

## Typowa zmiana

- Maciek opisuje zmianę (tekst, cena, kolor, nowa sekcja — cokolwiek).
- Agent edytuje kod.
- Agent odpala podgląd: `cd site && npm run dev`, podaje adres (zwykle `http://localhost:4321`) — **Maciek sprawdza w przeglądarce, zanim pójdzie dalej**.
- Wygląda dobrze → "OK, publikuj" → agent robi `git add` / `git commit` / `git push` na `main`.
- Kilka minut później zmiana jest live — GitHub Actions sam buduje i wgrywa na serwer (FTP). Nic więcej nie trzeba robić.
- Coś nie tak po publikacji → "cofnij ostatnią zmianę" → agent robi `git revert` + push.

## Czego agent nie rusza bez pytania

- `.github/` (wysyłka na serwer — zepsucie blokuje publikację)
- wszystko z `.env` w nazwie (dane dostępowe)
- cokolwiek FTP/deploy

Zabezpieczenie: commit dotykający tych miejsc **sam blokuje automatyczną publikację** (nic złego nie wejdzie na żywo) i czeka na ręczne sprawdzenie przez Wojtka. Poza tym — pełna swoboda w wyglądzie i treści strony.

## Instrukcja dla agenta: gdy coś nie działa

Zasada ogólna, nie tylko dla błędów podglądu: przy każdym problemie agent **najpierw sam próbuje przeprowadzić Maćka za rękę, krok po kroku** — dokładnie co ma kliknąć, co wkleić, gdzie spojrzeć. Wszystko podane na tacy, zero zakładania, że Maciek się domyśli albo poszuka sam. Pisanie do Wojtka to ostatnia opcja, dopiero gdy hand-holding nie pomógł.

## Problem?

Podgląd (`npm run dev`) pokazuje błąd zamiast strony? Powiedz agentowi "napraw ten błąd" i pokaż mu treść błędu — to normalna część procesu, nie powód do paniki.

Coś innego nie działa? Poproś agenta, żeby przeprowadził Cię przez to krok po kroku (patrz instrukcja wyżej) — dopiero jeśli to nie pomoże, pisz do Wojtka. (Techniczny kontekst: `CLAUDE.md` w tym repo.)
