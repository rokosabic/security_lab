// Učitaj status ranjivosti pri učitavanju stranice
document.addEventListener('DOMContentLoaded', () => {
    loadVulnerabilityStatus();
    loadUsers();
});

// Učitaj status ranjivosti
async function loadVulnerabilityStatus() {
    try {
        const [sqlStatus, sensitiveStatus] = await Promise.all([
            fetch('/api/sql-injection-status').then(r => r.json()),
            fetch('/api/sensitive-data-status').then(r => r.json())
        ]);

        document.getElementById('sqlInjectionToggle').checked = sqlStatus.enabled;
        document.getElementById('sensitiveDataToggle').checked = sensitiveStatus.enabled;
    } catch (error) {
        console.error('Greška pri učitavanju statusa:', error);
    }
}

// Toggle SQL Injection
document.getElementById('sqlInjectionToggle').addEventListener('change', async (e) => {
    try {
        const response = await fetch('/api/toggle-sql-injection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: e.target.checked })
        });
        const data = await response.json();
        showResult('sqlResult',
            `SQL Injection ranjivost: ${data.enabled ? 'UKLJUČENA' : 'ISKLJUČENA'}`,
            data.enabled ? 'warning' : 'success'
        );
    } catch (error) {
        console.error('Greška pri promjeni statusa:', error);
    }
});

// Toggle Sensitive Data Exposure
document.getElementById('sensitiveDataToggle').addEventListener('change', async (e) => {
    try {
        const response = await fetch('/api/toggle-sensitive-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: e.target.checked })
        });
        const data = await response.json();
        showResult('sensitiveDataResult',
            `Sensitive Data Exposure ranjivost: ${data.enabled ? 'UKLJUČENA' : 'ISKLJUČENA'}`,
            data.enabled ? 'warning' : 'success'
        );
    } catch (error) {
        console.error('Greška pri promjeni statusa:', error);
    }
});

// Spremi podatke (SQL Injection)
async function saveData() {
    const message = document.getElementById('message').value;
    const pin = document.getElementById('pin').value;

    if (!message || !pin) {
        showResult('sqlResult', 'Molimo unesite poruku i PIN', 'error');
        return;
    }

    try {
        const response = await fetch('/api/save-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, pin })
        });

        const data = await response.json();

        if (data.success) {
            showResult('sqlResult',
                `${data.message}<br>
                <span class="vulnerable-badge ${data.vulnerable ? 'yes' : 'no'}">
                    ${data.vulnerable ? 'RANJIVO' : 'SIGURNO'}
                </span>`,
                'success'
            );

            if (data.query) {
                const queryDiv = document.createElement('div');
                queryDiv.className = 'query-display';
                queryDiv.textContent = `SQL Upit: ${data.query}`;
                document.getElementById('sqlResult').appendChild(queryDiv);
            }

            displayUsers(data.users);
        } else {
            showResult('sqlResult', `Greška: ${data.error}`, 'error');
            if (data.query) {
                const queryDiv = document.createElement('div');
                queryDiv.className = 'query-display';
                queryDiv.textContent = `SQL Upit: ${data.query}`;
                document.getElementById('sqlResult').appendChild(queryDiv);
            }
        }
    } catch (error) {
        showResult('sqlResult', `Greška: ${error.message}`, 'error');
    }
}

// Pretraži korisnike (SQL Injection)
async function searchUsers() {
    const message = document.getElementById('message').value;

    if (!message) {
        showResult('sqlResult', 'Molimo unesite poruku za pretragu', 'error');
        return;
    }

    try {
        const response = await fetch('/api/search-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (data.success) {
            showResult('sqlResult',
                `Pronađeno korisnika: ${data.users.length}<br>
                <span class="vulnerable-badge ${data.vulnerable ? 'yes' : 'no'}">
                    ${data.vulnerable ? 'RANJIVO' : 'SIGURNO'}
                </span>`,
                'info'
            );

            if (data.query) {
                const queryDiv = document.createElement('div');
                queryDiv.className = 'query-display';
                queryDiv.textContent = `SQL Upit: ${data.query}`;
                document.getElementById('sqlResult').appendChild(queryDiv);
            }

            displayUsers(data.users);
        } else {
            showResult('sqlResult', `Greška: ${data.error}`, 'error');
            if (data.query) {
                const queryDiv = document.createElement('div');
                queryDiv.className = 'query-display';
                queryDiv.textContent = `SQL Upit: ${data.query}`;
                document.getElementById('sqlResult').appendChild(queryDiv);
            }
        }
    } catch (error) {
        showResult('sqlResult', `Greška: ${error.message}`, 'error');
    }
}

// Prikaži osjetljive podatke
async function showSensitiveData() {
    try {
        const response = await fetch('/api/sensitive-data');
        const data = await response.json();

        if (data.success) {
            const resultDiv = document.getElementById('sensitiveDataResult');
            resultDiv.className = `result show ${data.vulnerable ? 'warning' : 'success'}`;

            let html = `
                <strong>${data.message}</strong><br>
                <span class="vulnerable-badge ${data.vulnerable ? 'yes' : 'no'}">
                    ${data.vulnerable ? 'RANJIVO' : 'SIGURNO'}
                </span>
            `;

            if (data.vulnerable && data.data) {
                html += '<div class="sensitive-data-display">';

                // Korisnici
                if (data.data.users) {
                    html += '<div class="data-section">';
                    html += '<h3>Korisnici (osjetljivi podaci)</h3>';
                    html += '<ul>';
                    data.data.users.forEach(user => {
                        html += `
                            <li>
                                <strong>ID:</strong> ${user.id}<br>
                                <strong>Ime:</strong> ${user.name}<br>
                                <strong>Email:</strong> ${user.email}<br>
                                <strong>OIB:</strong> <span class="highlight">${user.oib}</span><br>
                                <strong>Kreditna kartica:</strong> <span class="highlight">${user.creditCard}</span>
                            </li>
                        `;
                    });
                    html += '</ul></div>';
                }

                // Session cookies
                if (data.data.sessionCookies) {
                    html += '<div class="data-section">';
                    html += '<h3>Session Cookies</h3>';
                    html += `<p><span class="highlight">${data.data.sessionCookies}</span></p>`;
                    html += '</div>';
                }

                // API ključevi
                if (data.data.apiKeys) {
                    html += '<div class="data-section">';
                    html += '<h3>API Ključevi</h3>';
                    html += '<ul>';
                    data.data.apiKeys.forEach(key => {
                        html += `<li><span class="highlight">${key}</span></li>`;
                    });
                    html += '</ul></div>';
                }

                html += '</div>';
            } else if (!data.vulnerable && data.data) {
                html += '<div class="sensitive-data-display">';
                html += '<div class="data-section">';
                html += '<h3>Korisnici (samo osnovni podaci)</h3>';
                html += '<ul>';
                data.data.users.forEach(user => {
                    html += `
                        <li>
                            <strong>ID:</strong> ${user.id}<br>
                            <strong>Ime:</strong> ${user.name}
                        </li>
                    `;
                });
                html += '</ul></div></div>';
            }

            resultDiv.innerHTML = html;
        } else {
            showResult('sensitiveDataResult', `Greška: ${data.error}`, 'error');
        }
    } catch (error) {
        showResult('sensitiveDataResult', `Greška: ${error.message}`, 'error');
    }
}

// Resetiraj bazu podataka
async function resetDatabase() {
    try {
        const response = await fetch('/api/reset-database', {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showResult('sqlResult', 'Baza podataka resetirana', 'success');
            displayUsers(data.users);
        } else {
            showResult('sqlResult', 'Greška pri resetiranju baze', 'error');
        }
    } catch (error) {
        showResult('sqlResult', `Greška: ${error.message}`, 'error');
    }
}

// Učitaj korisnike
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();

        if (data.success) {
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Greška pri učitavanju korisnika:', error);
    }
}

// Prikaži korisnike u tablici
function displayUsers(users) {
    const usersDiv = document.getElementById('sqlUsers');

    if (!users || users.length === 0) {
        usersDiv.classList.remove('show');
        return;
    }

    let html = '<h3>Korisnici u bazi podataka:</h3>';
    html += '<table>';
    html += '<thead><tr><th>ID</th><th>Poruka</th><th>PIN</th></tr></thead>';
    html += '<tbody>';

    users.forEach(user => {
        html += `<tr>
            <td>${user.id}</td>
            <td>${user.message}</td>
            <td>${user.pin}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    usersDiv.innerHTML = html;
    usersDiv.classList.add('show');
}

// Pomoćna funkcija za prikaz rezultata
function showResult(elementId, message, type = 'info') {
    const resultDiv = document.getElementById(elementId);
    resultDiv.className = `result show ${type}`;
    resultDiv.innerHTML = message;
}
