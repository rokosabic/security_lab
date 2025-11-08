# Sigurnosni Lab - Demonstracija Ranjivosti Web Aplikacija

Web aplikacija za demonstraciju sigurnosnih ranjivosti: SQL Injection i Sensitive Data Exposure.

## Implementirane Ranjivosti

1. **SQL ubacivanje (SQL Injection)**
   - Implementirana tautologija (npr. `' OR 1=1 #`)
   - Toggle za uključivanje/isključivanje ranjivosti
   - Prikaz izvršenog SQL upita
   - Prikaz svih korisnika u bazi podataka nakon napada

2. **Nesigurna pohrana osjetljivih podataka (Sensitive Data Exposure)**
   - Prikaz osjetljivih podataka (OIB, kreditne kartice, session cookies, API ključevi)
   - Toggle za uključivanje/isključivanje ranjivosti
   - Kada je ranjivost isključena, prikazuju se samo osnovni podaci

## Instalacija i Pokretanje

### Lokalno pokretanje

1. Instaliraj Node.js (verzija 14 ili novija)

2. Instaliraj ovisnosti:
```bash
npm install
```

3. Pokreni server:
```bash
npm start
```

4. Otvori preglednik na adresi:
```
http://localhost:3000
```

### Pokretanje u cloud okruženju (Render)

1. Poveži GitHub repozitorij s Render servisom
2. Postavi build command: `npm install`
3. Postavi start command: `npm start`
4. Render će automatski detektirati Node.js aplikaciju

## Testiranje Ranjivosti

### SQL Injection

1. **Uključi ranjivost** pomoću checkboxa "Ranjivost uključena"

2. **Testiranje tautologije:**
   - U polje "Poruka" unesi: `' OR 1=1 #`
   - U polje "PIN" unesi bilo što (npr. `1234`)
   - Klikni "Spremi podatke"
   - Uoči kako se SQL upit izvršava i vraća sve korisnike

3. **Testiranje sigurne verzije:**
   - Isključi ranjivost pomoću checkboxa
   - Pokušaj isti napad
   - Uoči kako se koriste parametrizirani upiti

4. **Pregled baze podataka:**
   - Klikni "Pretraži korisnike" da vidiš sve korisnike
   - Klikni "Resetiraj bazu" da vratiš početno stanje

### Sensitive Data Exposure

1. **Uključi ranjivost** pomoću checkboxa "Ranjivost uključena"

2. **Prikaži osjetljive podatke:**
   - Klikni "Prikaži stranicu sa osjetljivim podacima (GDPR)"
   - Uoči kako se prikazuju:
     - OIB korisnika
     - Brojevi kreditnih kartica
     - Session cookies
     - API ključevi

3. **Testiranje sigurne verzije:**
   - Isključi ranjivost pomoću checkboxa
   - Klikni ponovno na gumb
   - Uoči kako se prikazuju samo osnovni podaci (ID i ime)

## Struktura Projekta

```
security-lab/
├── server.js          # Express server s API endpointima
├── package.json       # Node.js ovisnosti
├── .gitignore        # Git ignore datoteka
├── README.md         # Dokumentacija
└── public/
    ├── index.html    # Glavna HTML stranica
    ├── style.css     # CSS stilovi
    └── script.js      # JavaScript klijentska logika
```

## API Endpointi

- `POST /api/toggle-sql-injection` - Uključi/isključi SQL Injection ranjivost
- `GET /api/sql-injection-status` - Dohvati status SQL Injection ranjivosti
- `POST /api/toggle-sensitive-data` - Uključi/isključi Sensitive Data Exposure ranjivost
- `GET /api/sensitive-data-status` - Dohvati status Sensitive Data Exposure ranjivosti
- `POST /api/save-data` - Spremi podatke (ranjivo/sigurno ovisno o toggleu)
- `POST /api/search-users` - Pretraži korisnike (ranjivo/sigurno ovisno o toggleu)
- `GET /api/sensitive-data` - Dohvati osjetljive podatke (ranjivo/sigurno ovisno o toggleu)
- `POST /api/reset-database` - Resetiraj bazu podataka
- `GET /api/users` - Dohvati sve korisnike

## Napomene

- Baza podataka je u memoriji (SQLite in-memory), tako da se resetira pri svakom restartu servera
- Aplikacija je namijenjena isključivo za edukacijske svrhe
- Ne koristite ovu aplikaciju u produkcijskom okruženju

## Autor

Projekt izrađen za potrebe kolegija Sigurnost web aplikacija.
