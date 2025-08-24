import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    // 1. Sprawdź hasło (tak jak poprzednio)
    const { password } = request.body;
    const correctPassword = process.env.PAGE_PASSWORD;

    if (password !== correctPassword) {
        return response.status(401).send('<h1>Błędne hasło!</h1><p><a href="/">Spróbuj ponownie</a></p>');
    }

    try {
        // 2. Zdefiniuj ścieżkę do chronionego folderu
        const protectedDir = path.join(process.cwd(), '_protected');

        // 3. Odczytaj zawartość folderu `_protected`
        const filesInDir = await fs.readdir(protectedDir);

        // 4. Znajdź PIERWSZY plik w folderze, który kończy się na .html
        const htmlFile = filesInDir.find(file => file.endsWith('.html'));

        // 5. Sprawdź, czy plik został znaleziony
        if (!htmlFile) {
            return response.status(404).send('<h1>Błąd 404</h1><p>Nie znaleziono pliku HTML w folderze chronionym.</p>');
        }

        // 6. Odczytaj i wyślij zawartość znalezionego pliku
        const filePath = path.join(protectedDir, htmlFile);
        const fileContent = await fs.readFile(filePath, 'utf8');

        response.setHeader('Content-Type', 'text/html');
        response.status(200).send(fileContent);

    } catch (error) {
        console.error(error); // Wypisz błąd w logach Vercel dla diagnostyki
        return response.status(500).send('<h1>Błąd serwera</h1><p>Wystąpił problem podczas próby odczytania pliku.</p>');
    }
}