import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(request, response) {
    try {
        const requestedDir = request.query.dir;
        if (!requestedDir) {
            return response.status(400).send('<h1>Nie podano nazwy folderu</h1>');
        }
        
        const safeDirName = path.normalize(requestedDir).replace(/^(\.\.[\/\\])+/, '');
        const targetDir = path.join(process.cwd(), '_protected', safeDirName);

        if (!targetDir.startsWith(path.join(process.cwd(), '_protected'))) {
             return response.status(403).send('<h1>Dostęp zabroniony</h1>');
        }

        const filesInDir = await fs.readdir(targetDir);
        const htmlFile = filesInDir.find(file => file.endsWith('.html'));

        if (!htmlFile) {
            return response.status(404).send('<h1>W tym folderze nie ma pliku HTML</h1>');
        }

        const filePath = path.join(targetDir, htmlFile);
        const fileContent = await fs.readFile(filePath, 'utf8');

        response.setHeader('Content-Type', 'text/html').status(200).send(fileContent);

    } catch (error) {
        response.status(404).send('<h1>404 - Folder lub plik nie znaleziony</h1>');
    }
}