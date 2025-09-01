import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { password } = request.body;
    const correctPassword = process.env.PAGE_PASSWORD;

    if (password !== correctPassword) {
        // --- TA LINIA ZOSTAŁA ZMIENIONA ---
        // Zamiast wysyłać brzydką stronę, przekierowujemy z powrotem do strony głównej z parametrem błędu.
        return response.redirect(302, '/?error=true');
        // --- KONIEC ZMIANY ---
    }

    try {
        const protectedDir = path.join(process.cwd(), '_protected');
        const filesInDir = await fs.readdir(protectedDir);
        const htmlFile = filesInDir.find(file => file.endsWith('.html'));

        if (!htmlFile) {
            return response.status(404).send('<h1>Błąd 404</h1><p>Nie znaleziono pliku HTML w folderze chronionym.</p>');
        }

        const filePath = path.join(protectedDir, htmlFile);
        const fileContent = await fs.readFile(filePath, 'utf8');

        response.setHeader('Content-Type', 'text/html');
        response.status(200).send(fileContent);

    } catch (error) {
        console.error(error);
        return response.status(500).send('<h1>Błąd serwera</h1><p>Wystąpił problem podczas próby odczytania pliku.</p>');
    }
}