import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(request, response) {
  // Sprawdzamy, czy metoda to POST (czy formularz został wysłany)
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  const { password } = request.body;
  const correctPassword = process.env.PAGE_PASSWORD;

  if (password === correctPassword) {
    try {
      // SUKCES: Hasło poprawne.
      // 1. Zbuduj ścieżkę do chronionego pliku HTML.
      const filePath = path.join(process.cwd(), '_protected', 'secret.html');
      
      // 2. Odczytaj zawartość tego pliku.
      const fileContent = await fs.readFile(filePath, 'utf8');

      // 3. Wyślij zawartość pliku jako odpowiedź.
      response.setHeader('Content-Type', 'text/html');
      response.status(200).send(fileContent);

    } catch (error) {
      // Obsługa błędu, np. gdyby plik nie istniał
      response.status(500).send('<h1>Błąd serwera</h1><p>Nie można wczytać pliku.</p>');
    }
  } else {
    // BŁĄD: Hasło nieprawidłowe.
    response.status(401).send('<h1>Błędne hasło!</h1><p><a href="/">Spróbuj ponownie</a></p>');
  }
}