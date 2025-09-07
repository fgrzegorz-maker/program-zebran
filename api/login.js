import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    if (request.body.password !== process.env.PAGE_PASSWORD) {
        return response.redirect(302, '/?error=true');
    }

    try {
        const protectedDir = path.join(process.cwd(), '_protected');
        const allEntries = await fs.readdir(protectedDir, { withFileTypes: true });

        allEntries.sort((a, b) => a.name.localeCompare(b.name));

        let menuItemsHtml = '';
        const availableDirs = [];

        for (const entry of allEntries) {
            if (entry.isDirectory()) {
                const subdirPath = path.join(protectedDir, entry.name);
                const filesInSubdir = await fs.readdir(subdirPath);
                
                if (filesInSubdir.some(file => file.endsWith('.html'))) {
                    const displayName = entry.name.replace(/^(\d+-)/, '').trim();
                    menuItemsHtml += `<li><a href="#" class="menu-item" data-dir="${entry.name}">${displayName}</a></li>`;
                    availableDirs.push(entry.name);
                }
            }
        }
        
        const portalHtml = `
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Program zebrań</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    :root { 
                        --menu-width: 280px;
                        --primary-color: #4E7C82;
                    }
                    body { font-family: 'Lato', sans-serif; margin: 0; background-color: #f4f7f9; }
                    
                    .top-bar {
                        position: fixed; top: 0; left: 0; width: 100%;
                        background-color: var(--primary-color);
                        color: white;
                        padding: 0.5rem 1rem; /* ZMIANA: Średni padding */
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        box-sizing: border-box;
                    }
                    
                    #menu-toggle {
                        font-size: 1.6rem; /* ZMIANA: Średnia ikona */
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 0.3rem; /* ZMIANA: Średni padding ikony */
                        margin-right: 1rem;
                        color: white;
                    }

                    .current-item-title {
                        font-weight: 700;
                        font-size: 1rem; /* ZMIANA: Średni tekst tytułu */
                    }
                    .side-menu { position: fixed; top: 0; left: 0; width: var(--menu-width); height: 100%; background-color: #343a40; color: white; box-shadow: 2px 0 10px rgba(0,0,0,0.2); transform: translateX(calc(-1 * var(--menu-width))); transition: transform 0.3s ease-in-out; z-index: 2000; padding-top: 5rem; box-sizing: border-box; }
                    .side-menu.is-open { transform: translateX(0); }
                    .side-menu ul { list-style: none; padding: 0; margin: 0; }
                    .side-menu .menu-item { display: block; padding: 1.25rem 2rem; color: #f8f9fa; text-decoration: none; font-weight: 700; border-bottom: 1px solid #495057; transition: background-color 0.2s; }
                    .side-menu .menu-item:hover, .side-menu .menu-item.active { background-color: var(--primary-color); }
                    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); opacity: 0; visibility: hidden; transition: opacity 0.3s ease-in-out, visibility 0.3s; z-index: 1999; }
                    .overlay.is-visible { opacity: 1; visibility: visible; }
                    main {
                        padding-top: 52px; /* ZMIANA: Średni odstęp */
                        height: calc(100vh - 52px); /* ZMIANA: Dopasowana wysokość */
                        box-sizing: border-box;
                    }
                    #content-frame { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <div class="top-bar">
                    <button id="menu-toggle">☰</button>
                    <span id="current-item-title"></span>
                </div>
                <nav id="side-menu" class="side-menu">
                    <ul>
                        ${menuItemsHtml || '<li><a class="menu-item">Brak plików</a></li>'}
                    </ul>
                </nav>
                <div id="overlay" class="overlay"></div>
                <main>
                    <iframe id="content-frame" src="about:blank"></iframe>
                </main>
                <script>
                    const menuToggle = document.getElementById('menu-toggle');
                    const sideMenu = document.getElementById('side-menu');
                    const overlay = document.getElementById('overlay');
                    const frame = document.getElementById('content-frame');
                    const titleEl = document.getElementById('current-item-title');
                    const availableDirs = ${JSON.stringify(availableDirs)};

                    function closeMenu() { sideMenu.classList.remove('is-open'); overlay.classList.remove('is-visible'); }
                    function openMenu() { sideMenu.classList.add('is-open'); overlay.classList.add('is-visible'); }

                    menuToggle.addEventListener('click', openMenu);
                    overlay.addEventListener('click', closeMenu);

                    sideMenu.addEventListener('click', (event) => {
                        if (event.target.classList.contains('menu-item')) {
                            event.preventDefault();
                            document.querySelector('.menu-item.active')?.classList.remove('active');
                            event.target.classList.add('active');
                            const dirName = event.target.dataset.dir;
                            if (dirName) {
                                frame.src = '/api/file?dir=' + encodeURIComponent(dirName);
                                titleEl.textContent = dirName.replace(/^(\\d+-)/, '').trim();
                                closeMenu();
                            }
                        }
                    });

                    if (availableDirs.length > 0) {
                        const firstMenuItem = sideMenu.querySelector('.menu-item');
                        if (firstMenuItem) firstMenuItem.click();
                    } else {
                        titleEl.textContent = "Program zebrań";
                        frame.contentWindow.document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>Witaj!</h2><p>Brak dostępnych plików do wyświetlenia.</p></div>';
                    }
                </script>
            </body>
            </html>
        `;
        response.setHeader('Content-Type', 'text/html').status(200).send(portalHtml);

    } catch (error) {
        console.error(error);
        response.status(500).send('<h1>Błąd serwera</h1>');
    }
}